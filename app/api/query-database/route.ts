import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

/**
 * API pour interroger la base de données
 * Permet à l'IA de récupérer des informations sur le stock, clients, etc.
 */

interface QueryResult {
  type: string
  data: any
  summary: string
}

async function getStockSummary(): Promise<QueryResult> {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
  
  if (error || !products) {
    return { type: 'stock', data: null, summary: 'Erreur lors de la recuperation du stock.' }
  }

  const totalProducts = products.length
  const totalStock = products.reduce((sum, p: any) => sum + (p.stock || 0), 0)
  const lowStockProducts = products.filter((p: any) => p.stock < p.min_stock)
  const outOfStock = products.filter((p: any) => p.stock === 0)
  const totalValue = products.reduce((sum, p: any) => sum + (p.stock * p.price), 0)

  return {
    type: 'stock',
    data: {
      totalProducts,
      totalStock,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStock.length,
      totalValue,
      lowStockProducts: lowStockProducts.map((p: any) => ({
        name: p.name,
        stock: p.stock,
        minStock: p.min_stock,
        category: p.category
      })),
      outOfStockProducts: outOfStock.map((p: any) => p.name)
    },
    summary: `Stock total: ${totalStock} unites sur ${totalProducts} produits. Valeur: ${totalValue.toFixed(2)} euros. ${lowStockProducts.length} produits en stock bas, ${outOfStock.length} en rupture.`
  }
}

async function getOrdersSummary(): Promise<QueryResult> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
  
  if (error || !orders) {
    return { type: 'orders', data: null, summary: 'Erreur lors de la recuperation des commandes.' }
  }

  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o: any) => sum + (o.total_price || 0), 0)
  const pendingOrders = orders.filter((o: any) => o.status === 'pending')
  const completedOrders = orders.filter((o: any) => o.status === 'completed')

  return {
    type: 'orders',
    data: {
      totalOrders,
      totalRevenue,
      pendingCount: pendingOrders.length,
      completedCount: completedOrders.length,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    },
    summary: `${totalOrders} commandes totales. Revenus: ${totalRevenue.toFixed(2)} euros. ${pendingOrders.length} en attente, ${completedOrders.length} completees.`
  }
}

async function getProductsToReorder(): Promise<QueryResult> {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
  
  if (error || !products) {
    return { type: 'reorder', data: null, summary: 'Erreur lors de la recuperation.' }
  }

  const toReorder = products.filter((p: any) => p.stock < p.min_stock)
  const critical = toReorder.filter((p: any) => p.stock === 0 || p.stock < p.min_stock / 2)

  return {
    type: 'reorder',
    data: {
      toReorder: toReorder.map((p: any) => ({
        name: p.name,
        sku: p.sku,
        category: p.category,
        currentStock: p.stock,
        minStock: p.min_stock,
        suggestedOrder: p.min_stock * 2 - p.stock,
        estimatedCost: (p.min_stock * 2 - p.stock) * p.cost
      })),
      criticalCount: critical.length
    },
    summary: `${toReorder.length} produits a racheter dont ${critical.length} critiques.`
  }
}

async function getTopProducts(): Promise<QueryResult> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('product_id, quantity')
  
  if (error || !orders) {
    return { type: 'top_products', data: null, summary: 'Erreur.' }
  }

  const productSales: Record<string, number> = {}
  orders.forEach((o: any) => {
    productSales[o.product_id] = (productSales[o.product_id] || 0) + o.quantity
  })

  const { data: products } = await supabase.from('products').select('id, name')
  const productNames: Record<string, string> = {}
  products?.forEach((p: any) => { productNames[p.id] = p.name })

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, quantity]) => ({ 
      id, 
      name: productNames[id] || 'Inconnu', 
      totalSold: quantity 
    }))

  return {
    type: 'top_products',
    data: { topProducts },
    summary: `Top produit: ${topProducts[0]?.name || 'N/A'} (${topProducts[0]?.totalSold || 0} vendus).`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    const lowerQuery = query.toLowerCase()

    const results: QueryResult[] = []

    if (lowerQuery.includes('stock') || lowerQuery.includes('inventaire') || lowerQuery.includes('combien')) {
      results.push(await getStockSummary())
    }
    
    if (lowerQuery.includes('commande') || lowerQuery.includes('vente') || lowerQuery.includes('revenu')) {
      results.push(await getOrdersSummary())
    }
    
    if (lowerQuery.includes('racheter') || lowerQuery.includes('reapprovisionner') || lowerQuery.includes('commander') || lowerQuery.includes('rupture')) {
      results.push(await getProductsToReorder())
    }
    
    if (lowerQuery.includes('meilleur') || lowerQuery.includes('top') || lowerQuery.includes('populaire')) {
      results.push(await getTopProducts())
    }

    if (results.length === 0) {
      results.push(await getStockSummary())
      results.push(await getOrdersSummary())
    }

    return NextResponse.json({
      success: true,
      results,
      summary: results.map(r => r.summary).join(' ')
    })
  } catch (error: any) {
    console.error('Erreur query-database:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const stock = await getStockSummary()
    const orders = await getOrdersSummary()
    const reorder = await getProductsToReorder()

    return NextResponse.json({
      success: true,
      stock: stock.data,
      orders: orders.data,
      reorder: reorder.data,
      summary: `${stock.summary} ${orders.summary} ${reorder.summary}`
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

