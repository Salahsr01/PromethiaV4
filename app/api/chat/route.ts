import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse, type AIMessage } from '@/app/lib/ai-provider'
import { supabase } from '@/app/lib/supabase'

// Récupérer les données de la base pour le contexte
async function getDatabaseContext() {
  try {
    // Produits et stock
    const { data: products } = await supabase
      .from('products')
      .select('*')
    
    // Commandes
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
    
    // Mouvements de stock
    const { data: stockMovements } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!products || !orders) {
      return null
    }

    // Calculer les statistiques
    const totalProducts = products.length
    const totalStock = products.reduce((sum, p: any) => sum + (p.stock || 0), 0)
    const stockValue = products.reduce((sum, p: any) => sum + ((p.stock || 0) * (p.cost || 0)), 0)
    const lowStockProducts = products.filter((p: any) => p.stock < p.min_stock)
    const outOfStockProducts = products.filter((p: any) => p.stock === 0)

    const totalOrders = orders.length
    const pendingOrders = orders.filter((o: any) => o.status === 'pending').length
    const completedOrders = orders.filter((o: any) => o.status === 'completed').length
    const totalRevenue = orders.reduce((sum, o: any) => sum + (o.total_price || 0), 0)

    // Top produits par ventes
    const productSales: Record<string, number> = {}
    orders.forEach((o: any) => {
      productSales[o.product_id] = (productSales[o.product_id] || 0) + o.quantity
    })
    const topProductIds = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    const topProducts = products
      .filter((p: any) => topProductIds.includes(p.id))
      .map((p: any) => ({
        name: p.name,
        sold: productSales[p.id] || 0,
        stock: p.stock
      }))

    // Équipements à racheter (stock < min_stock)
    const toReorder = lowStockProducts.map((p: any) => ({
      name: p.name,
      stock: p.stock,
      minStock: p.min_stock,
      toOrder: p.min_stock - p.stock
    }))

    return {
      summary: {
        totalProducts,
        totalStock,
        stockValue: Math.round(stockValue),
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: Math.round(totalRevenue)
      },
      topProducts,
      toReorder,
      categories: [...new Set(products.map((p: any) => p.category))],
      recentMovements: stockMovements?.slice(0, 10) || []
    }
  } catch (error) {
    console.error('Erreur récupération contexte BDD:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, enableWebSearch } = await request.json()
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''

    // Vérifier si la question concerne la base de données
    const dbKeywords = [
      'stock', 'produit', 'commande', 'client', 'vente', 'inventaire',
      'combien', 'quantité', 'racheter', 'réapprovisionner', 'équipement',
      'base de données', 'données', 'statistique', 'chiffre', 'revenue',
      'total', 'manque', 'alerte', 'rupture', 'top', 'meilleur'
    ]
    
    const needsDbContext = dbKeywords.some(keyword => lastMessage.includes(keyword))
    
    // Vérifier si une recherche web est nécessaire
    const webSearchKeywords = [
      'recherche', 'cherche', 'trouve', 'informations sur', 'actualité', 'news',
      'dernières nouvelles', 'qu\'est-ce que', 'définition', 'explique',
      'comment ça marche', 'quand', 'où', 'pourquoi'
    ]
    const needsWebSearch = enableWebSearch && webSearchKeywords.some(keyword => lastMessage.includes(keyword))
    
    // Récupérer le contexte de la BDD si nécessaire
    let dbContext = null
    if (needsDbContext) {
      dbContext = await getDatabaseContext()
    }

    // Effectuer une recherche web si nécessaire (ou si enableWebSearch est activé)
    let webSearchResults = null
    if (needsWebSearch || enableWebSearch) {
      try {
        const searchResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/web-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: lastMessage })
        })
        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (searchData.success && searchData.results) {
            webSearchResults = searchData.results
          }
        }
      } catch (error) {
        console.warn('Erreur recherche web:', error)
      }
    }

    // Construire le prompt système
    let systemPrompt = `Tu es Promethia, un assistant IA professionnel et intelligent. 
Tu aides les utilisateurs dans leurs tâches professionnelles : gestion de projet, analyse de données, planification, et plus encore.
Tu réponds toujours en français de manière claire, concise et utile.

FONCTIONNALITÉS :
- Analyse de données et génération de rapports
- Gestion de projet et planification
- Conseils stratégiques et opérationnels
- Recherche d'informations et synthèse
- Aide à la rédaction et communication

FORMAT DE CODE :
Quand tu dois afficher du code, utilise le format suivant :
\`\`\`language:filename.ext
code ici
\`\`\`

Exemples :
\`\`\`python:analyse.py
def calculer_stock():
    return total_stock
\`\`\`

\`\`\`sql:requete.sql
SELECT * FROM products WHERE stock < min_stock;
\`\`\`

Sois professionnel mais accessible.`

    // Ajouter les résultats de recherche web si disponibles
    if (webSearchResults && webSearchResults.success && webSearchResults.results.length > 0) {
      systemPrompt += `\n\n🌐 RÉSULTATS DE RECHERCHE WEB (pour enrichir ta réponse) :\n`
      webSearchResults.results.slice(0, 5).forEach((result: any, index: number) => {
        systemPrompt += `\n${index + 1}. ${result.title}\n   URL: ${result.url}\n   Résumé: ${result.snippet}\n`
      })
      systemPrompt += `\nUtilise ces informations pour enrichir ta réponse si elles sont pertinentes. Cite les sources quand c'est approprié.`
    }

    // Ajouter le contexte de la BDD si disponible
    if (dbContext) {
      systemPrompt += `

📊 DONNÉES DE LA BASE DE DONNÉES (temps réel) :

RÉSUMÉ :
- Nombre total de produits : ${dbContext.summary.totalProducts}
- Stock total : ${dbContext.summary.totalStock} unités
- Valeur du stock : ${dbContext.summary.stockValue}€
- Produits en stock faible : ${dbContext.summary.lowStockCount}
- Produits en rupture : ${dbContext.summary.outOfStockCount}
- Total commandes : ${dbContext.summary.totalOrders}
- Commandes en attente : ${dbContext.summary.pendingOrders}
- Commandes complétées : ${dbContext.summary.completedOrders}
- Revenus totaux : ${dbContext.summary.totalRevenue}€

TOP PRODUITS (par ventes) :
${dbContext.topProducts.map((p, i) => `${i+1}. ${p.name} - ${p.sold} vendus (stock: ${p.stock})`).join('\n')}

PRODUITS À RÉAPPROVISIONNER :
${dbContext.toReorder.length > 0 
  ? dbContext.toReorder.map(p => `- ${p.name}: ${p.stock}/${p.minStock} (commander ${p.toOrder} unités)`).join('\n')
  : 'Aucun produit à réapprovisionner'}

CATÉGORIES : ${dbContext.categories.join(', ')}

Utilise ces données pour répondre précisément aux questions de l'utilisateur sur le stock, les ventes, etc.
Si l'utilisateur demande une requête SQL ou du code, fournis-le dans le format approprié.`
    }

    const aiMessages: AIMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

    const response = await generateAIResponse(aiMessages, {
      systemPrompt
    })

    return NextResponse.json({
      message: response.content,
      model: response.model,
      provider: response.provider,
      hasDbContext: !!dbContext,
      hasWebSearch: !!webSearchResults,
      webSearchResults: webSearchResults ? webSearchResults.slice(0, 5) : null,
      success: true
    })
  } catch (error) {
    console.error('Erreur API Chat:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la réponse', success: false },
      { status: 500 }
    )
  }
}
