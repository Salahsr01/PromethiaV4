import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabase'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Récupérer toutes les données de la base
async function fetchAllData() {
  const supabase = createServerClient()

  const [products, orders, movements] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('orders').select('*'),
    supabase.from('stock_movements').select('*')
  ])

  const productsData = products.data || []
  const ordersData = orders.data || []
  const movementsData = movements.data || []

  // Calculer les métriques avancées
  const totalStock = productsData.reduce((sum, p: any) => sum + Number(p.stock || 0), 0)
  const stockValue = productsData.reduce((sum, p: any) => sum + (Number(p.stock || 0) * Number(p.cost || 0)), 0)

  // Alertes stock
  const lowStock = productsData.filter((p: any) => Number(p.stock || 0) <= Number(p.min_stock || 0) && Number(p.stock || 0) > 0)
  const outOfStock = productsData.filter((p: any) => Number(p.stock || 0) === 0)

  // Ventes par statut
  const completedOrders = ordersData.filter((o: any) => o.status === 'completed')
  const revenue = completedOrders.reduce((sum, o: any) => sum + parseFloat(o.total_price || '0'), 0)
  const totalMargin = completedOrders.reduce((sum, o: any) => sum + parseFloat(o.margin || '0'), 0)
  const totalCost = completedOrders.reduce((sum, o: any) => sum + parseFloat(o.cost || '0'), 0)

  // Ventes par canal
  const salesByChannel: Record<string, { count: number; revenue: number }> = {}
  completedOrders.forEach((o: any) => {
    if (!salesByChannel[o.channel]) {
      salesByChannel[o.channel] = { count: 0, revenue: 0 }
    }
    salesByChannel[o.channel].count += o.quantity
    salesByChannel[o.channel].revenue += parseFloat(o.total_price)
  })

  // Ventes par catégorie
  const salesByCategory: Record<string, { count: number; revenue: number }> = {}
  completedOrders.forEach((o: any) => {
    const product: any = productsData.find((p: any) => p.sku === o.product_sku)
    if (product) {
      if (!salesByCategory[product.category]) {
        salesByCategory[product.category] = { count: 0, revenue: 0 }
      }
      salesByCategory[product.category].count += Number(o.quantity || 0)
      salesByCategory[product.category].revenue += parseFloat(o.total_price || '0')
    }
  })

  // Top produits
  const salesByProduct: Record<string, { quantity: number; revenue: number; margin: number }> = {}
  completedOrders.forEach((o: any) => {
    if (!salesByProduct[o.product_name]) {
      salesByProduct[o.product_name] = { quantity: 0, revenue: 0, margin: 0 }
    }
    salesByProduct[o.product_name].quantity += Number(o.quantity || 0)
    salesByProduct[o.product_name].revenue += parseFloat(o.total_price || '0')
    salesByProduct[o.product_name].margin += parseFloat(o.margin || '0')
  })

  const topProducts = Object.entries(salesByProduct)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  // Évolution mensuelle
  const monthlyRevenue: Record<string, number> = {}
  completedOrders.forEach((o: any) => {
    const month = String(o.created_at || '').substring(0, 7) // YYYY-MM
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(o.total_price || '0')
  })

  // Stock mort (pas de vente depuis 60 jours)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const recentSales = new Set(
    completedOrders
      .filter((o: any) => new Date(o.created_at || Date.now()) > sixtyDaysAgo)
      .map((o: any) => o.product_sku)
  )
  const deadStock = productsData
    .filter((p: any) => !recentSales.has(p.sku) && Number(p.stock || 0) > 0)
    .map((p: any) => ({
      name: p.name,
      stock: Number(p.stock || 0),
      value: Number(p.stock || 0) * Number(p.cost || 0),
      daysSinceLastSale: 60
    }))

  // Rotation de stock
  const stockRotation = productsData.map((p: any) => {
    const productSales = completedOrders
      .filter((o: any) => o.product_sku === p.sku)
      .reduce((sum, o: any) => sum + Number(o.quantity || 0), 0)
    const avgMonthlyStock = Number(p.stock || 0) // Simplifié
    const rotation = avgMonthlyStock > 0 ? (productSales / 6) / avgMonthlyStock : 0
    return {
      name: p.name,
      stock: Number(p.stock || 0),
      monthlySales: Math.round(productSales / 6),
      rotation: Math.round(rotation * 100) / 100
    }
  }).sort((a, b) => a.rotation - b.rotation)

  return {
    summary: {
      totalProducts: productsData.length,
      totalStock,
      stockValue: Math.round(stockValue),
      totalOrders: ordersData.length,
      completedOrders: completedOrders.length,
      revenue: Math.round(revenue),
      margin: Math.round(totalMargin),
      cost: Math.round(totalCost),
      marginRate: revenue > 0 ? Math.round((totalMargin / revenue) * 100) : 0,
      avgOrderValue: completedOrders.length > 0 ? Math.round(revenue / completedOrders.length) : 0
    },
    alerts: {
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      deadStockCount: deadStock.length,
      lowStockProducts: lowStock.map((p: any) => ({
        name: p.name,
        sku: p.sku,
        stock: Number(p.stock || 0),
        minStock: Number(p.min_stock || 0),
        urgency: Number(p.stock || 0) <= Number(p.min_stock || 0) / 2 ? 'critical' : 'warning'
      })),
      outOfStockProducts: outOfStock.map((p: any) => ({ name: p.name, sku: p.sku })),
      deadStockProducts: deadStock
    },
    sales: {
      byChannel: salesByChannel,
      byCategory: salesByCategory,
      topProducts,
      monthlyRevenue: Object.entries(monthlyRevenue)
        .map(([month, value]) => ({ month, revenue: Math.round(value) }))
        .sort((a, b) => a.month.localeCompare(b.month))
    },
    inventory: {
      byCategory: Object.entries(
        productsData.reduce((acc, p: any) => {
          if (!acc[p.category]) acc[p.category] = { count: 0, stock: 0, value: 0 }
          acc[p.category].count++
          acc[p.category].stock += p.stock
          acc[p.category].value += p.stock * p.cost
          return acc
        }, {} as Record<string, { count: number; stock: number; value: number }>)
      ).map(([category, data]) => ({ category, ...data })),
      slowMoving: stockRotation.filter((p: any) => p.rotation < 0.5).slice(0, 5),
      fastMoving: stockRotation.filter((p: any) => p.rotation >= 1).slice(-5).reverse()
    },
    suppliers: productsData.reduce((acc, p: any) => {
      if (!acc[p.supplier]) acc[p.supplier] = { products: 0, stockValue: 0 }
      acc[p.supplier].products++
      acc[p.supplier].stockValue += p.stock * p.cost
      return acc
    }, {} as Record<string, { products: number; stockValue: number }>)
  }
}

export async function POST(request: Request) {
  try {
    const { description } = await request.json()

    // Récupérer toutes les données
    const data = await fetchAllData()

    // Demander à Claude d'analyser et créer le dashboard
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Tu es un expert en business intelligence et data visualization. Tu vas créer un dashboard professionnel et riche.

DONNÉES RÉELLES DE LA BASE :

${JSON.stringify(data, null, 2)}

DEMANDE : "${description || 'Créer un dashboard complet pour analyser le stock et les ventes'}"

Crée un dashboard ultra-complet avec PLUSIEURS types de widgets. Utilise TOUTES ces données réelles.

TYPES DE WIDGETS DISPONIBLES :

1. **kpi** - Indicateurs clés
   { "type": "kpi", "title": "...", "description": "...", "value": "...", "subValue": "±X%" }

2. **line-chart** - Graphique en ligne (évolutions temporelles)
   {
     "type": "line-chart",
     "title": "...",
     "description": "...",
     "data": [{"month": "Jan", "value": 1200}, {"month": "Feb", "value": 1500}, ...]
   }

3. **bar-chart** - Graphique en barres (comparaisons)
   {
     "type": "bar-chart",
     "title": "...",
     "description": "...",
     "data": [{"name": "Électronique", "value": 45000}, {"name": "Mobilier", "value": 32000}, ...]
   }

4. **pie-chart** - Graphique camembert (répartitions)
   {
     "type": "pie-chart",
     "title": "...",
     "description": "...",
     "data": [{"name": "En ligne", "value": 65}, {"name": "Magasin", "value": 35}]
   }

5. **area-chart** - Graphique zone (tendances cumulatives)
   {
     "type": "area-chart",
     "title": "...",
     "description": "...",
     "data": [{"month": "Jan", "revenue": 5000, "cost": 3000}, ...]
   }

6. **table** - Tableau de données
   {
     "type": "table",
     "title": "...",
     "description": "...",
     "data": {"rows": [{"name": "Produit A", "value": "125 unités"}, ...]}
   }

7. **alert** - Alertes importantes
   {
     "type": "alert",
     "title": "...",
     "description": "...",
     "data": {"items": ["Item 1", "Item 2"]}
   }

8. **progress** - Barre de progression
   {
     "type": "progress",
     "title": "...",
     "value": "...",
     "data": {"percentage": 75}
   }

9. **assistance** - Box d'assistance IA (OBLIGATOIRE - à placer en bas)
   {
     "type": "assistance",
     "title": "Assistance IA",
     "description": "Posez vos questions sur ce dashboard",
     "priority": "high",
     "gridSpan": 3
   }

STRUCTURE DU JSON À RETOURNER :
{
  "name": "Nom du dashboard (court, max 5 mots)",
  "description": "Description claire et concise",
  "insights": [
    "Insight 1 avec chiffres clés",
    "Insight 2 avec tendance",
    "Insight 3 avec alerte si nécessaire",
    "3 à 5 insights maximum"
  ],
  "layout": "grid-3col",
  "widgets": [
    // 8 à 12 widgets variés utilisant TOUS les types ci-dessus
    // Box d'assistance IA EN DERNIER
  ]
}

INSTRUCTIONS CRITIQUES :
1. Génère 8 à 12 widgets variés (KPI, graphiques, tables, alertes)
2. Utilise les VRAIES données, pas d'exemples
3. Pour les graphiques, fournis au moins 6-12 points de données
4. Mix les types : au moins 3 KPI, 3-4 graphiques différents, 1-2 tables, alertes si pertinent
5. Ajoute la box "assistance" EN DERNIER avec gridSpan: 3
6. Analyse vraiment les données pour des insights pertinents
7. Réponds UNIQUEMENT avec le JSON valide, rien d'autre`
        }
      ]
    })

    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Réponse invalide')
    }

    // Parser le JSON (gérer les cas où Claude ajoute du texte ou des erreurs)
    let jsonText = textContent.text
    
    // Essayer d'extraire le JSON
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    let dashboardConfig
    try {
      dashboardConfig = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Erreur parsing JSON, utilisation du fallback:', parseError)
      // Fallback avec les données brutes et widgets riches
      dashboardConfig = {
        name: description || 'Dashboard Analytique',
        description: 'Dashboard généré à partir de l\'analyse des données',
        layout: 'grid-3col',
        insights: [
          `Stock total: ${data.summary.totalStock} unités (${data.summary.stockValue.toLocaleString()}€)`,
          `Chiffre d'affaires: ${data.summary.revenue.toLocaleString()}€ avec une marge de ${data.summary.marginRate}%`,
          `${data.alerts.lowStockCount} produits en alerte de stock`,
          data.alerts.deadStockCount > 0 ? `${data.alerts.deadStockCount} produit(s) en stock mort` : 'Pas de stock mort détecté'
        ],
        widgets: [
          // KPIs
          { type: 'kpi', title: 'Valeur Stock', description: 'Valeur totale du stock', value: `${data.summary.stockValue.toLocaleString()}€`, subValue: `${data.summary.totalStock} unités`, priority: 'high' },
          { type: 'kpi', title: 'Chiffre d\'Affaires', description: 'CA total sur la période', value: `${data.summary.revenue.toLocaleString()}€`, subValue: `Marge: ${data.summary.margin.toLocaleString()}€ (${data.summary.marginRate}%)`, priority: 'high' },
          { type: 'kpi', title: 'Commandes', description: 'Commandes complétées', value: `${data.summary.completedOrders}`, subValue: `sur ${data.summary.totalOrders} total`, priority: 'medium' },

          // Graphique ligne - Évolution du CA
          { type: 'line-chart', title: 'Évolution du CA', description: 'Chiffre d\'affaires mensuel', data: data.sales.monthlyRevenue, gridSpan: 2 },

          // Graphique barres - Ventes par catégorie
          {
            type: 'bar-chart',
            title: 'Ventes par Catégorie',
            description: 'Répartition du CA par catégorie',
            data: Object.entries(data.sales.byCategory).map(([name, stats]: [string, any]) => ({ name, value: stats.revenue }))
          },

          // Graphique camembert - Ventes par canal
          {
            type: 'pie-chart',
            title: 'Ventes par Canal',
            description: 'Répartition du CA par canal de vente',
            data: Object.entries(data.sales.byChannel).map(([name, stats]: [string, any]) => ({ name, value: stats.revenue }))
          },

          // Alertes stock
          { type: 'alert', title: 'Alertes Stock', description: `${data.alerts.lowStockCount} produits nécessitent un réapprovisionnement`, value: `${data.alerts.lowStockCount} alertes`, priority: 'high', data: { items: data.alerts.lowStockProducts.map((p: { name: string; stock: number }) => `${p.name} (${p.stock} en stock)`) } },

          // Tableau - Top produits
          { type: 'table', title: 'Top Produits', description: 'Meilleurs produits par ventes', priority: 'medium', data: { rows: data.sales.topProducts.slice(0, 5).map((p: { name: string; quantity: number; revenue: number }) => ({ name: p.name, value: `${p.quantity} vendus (${p.revenue.toLocaleString()}€)` })) }, gridSpan: 2 },

          // Box d'assistance IA
          { type: 'assistance', title: 'Assistance IA', description: 'Posez vos questions sur ce dashboard', priority: 'high', gridSpan: 3 }
        ]
      }
    }

    return NextResponse.json({
      success: true,
      dashboard: dashboardConfig,
      rawData: data
    })

  } catch (error) {
    console.error('Erreur analyse:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const data = await fetchAllData()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

