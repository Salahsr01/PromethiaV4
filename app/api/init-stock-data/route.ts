import { NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabase'

// Données de test réalistes pour un e-commerce
const PRODUCTS = [
  { sku: 'IPHONE15-PRO', name: 'iPhone 15 Pro 256GB', category: 'Smartphones', price: 1199, cost: 850, stock: 45, min_stock: 20, supplier: 'Apple France' },
  { sku: 'IPHONE15', name: 'iPhone 15 128GB', category: 'Smartphones', price: 969, cost: 680, stock: 78, min_stock: 30, supplier: 'Apple France' },
  { sku: 'SAMSUNG-S24', name: 'Samsung Galaxy S24 Ultra', category: 'Smartphones', price: 1469, cost: 1050, stock: 23, min_stock: 15, supplier: 'Samsung Distribution' },
  { sku: 'MACBOOK-M3', name: 'MacBook Pro M3 14"', category: 'Laptops', price: 2399, cost: 1800, stock: 12, min_stock: 10, supplier: 'Apple France' },
  { sku: 'MACBOOK-AIR', name: 'MacBook Air M2 13"', category: 'Laptops', price: 1299, cost: 950, stock: 34, min_stock: 15, supplier: 'Apple France' },
  { sku: 'AIRPODS-PRO', name: 'AirPods Pro 2', category: 'Audio', price: 279, cost: 180, stock: 156, min_stock: 50, supplier: 'Apple France' },
  { sku: 'AIRPODS-MAX', name: 'AirPods Max', category: 'Audio', price: 579, cost: 420, stock: 8, min_stock: 10, supplier: 'Apple France' },
  { sku: 'SONY-WH1000', name: 'Sony WH-1000XM5', category: 'Audio', price: 379, cost: 260, stock: 67, min_stock: 25, supplier: 'Sony Europe' },
  { sku: 'IPAD-PRO', name: 'iPad Pro 12.9" M2', category: 'Tablets', price: 1329, cost: 980, stock: 19, min_stock: 12, supplier: 'Apple France' },
  { sku: 'IPAD-AIR', name: 'iPad Air 10.9"', category: 'Tablets', price: 769, cost: 550, stock: 42, min_stock: 20, supplier: 'Apple France' },
  { sku: 'WATCH-ULTRA', name: 'Apple Watch Ultra 2', category: 'Wearables', price: 899, cost: 650, stock: 28, min_stock: 15, supplier: 'Apple France' },
  { sku: 'WATCH-S9', name: 'Apple Watch Series 9', category: 'Wearables', price: 449, cost: 320, stock: 89, min_stock: 40, supplier: 'Apple France' },
  { sku: 'PS5-STD', name: 'PlayStation 5', category: 'Gaming', price: 549, cost: 450, stock: 5, min_stock: 20, supplier: 'Sony Europe' },
  { sku: 'PS5-DIG', name: 'PlayStation 5 Digital', category: 'Gaming', price: 449, cost: 380, stock: 3, min_stock: 15, supplier: 'Sony Europe' },
  { sku: 'XBOX-X', name: 'Xbox Series X', category: 'Gaming', price: 499, cost: 420, stock: 11, min_stock: 15, supplier: 'Microsoft France' },
  { sku: 'SWITCH-OLED', name: 'Nintendo Switch OLED', category: 'Gaming', price: 349, cost: 280, stock: 67, min_stock: 30, supplier: 'Nintendo Europe' },
  { sku: 'DYSON-V15', name: 'Dyson V15 Detect', category: 'Électroménager', price: 699, cost: 520, stock: 14, min_stock: 8, supplier: 'Dyson SAS' },
  { sku: 'CABLE-USB-C', name: 'Câble USB-C 2m', category: 'Accessoires', price: 19, cost: 5, stock: 423, min_stock: 100, supplier: 'Generic Tech' },
  { sku: 'COQUE-IP15', name: 'Coque iPhone 15 Pro', category: 'Accessoires', price: 49, cost: 12, stock: 234, min_stock: 80, supplier: 'Generic Tech' },
  { sku: 'CHARGEUR-65W', name: 'Chargeur USB-C 65W', category: 'Accessoires', price: 59, cost: 22, stock: 187, min_stock: 60, supplier: 'Anker France' },
]

// Générer des commandes sur les 6 derniers mois
function generateOrders() {
  const orders = []
  const statuses = ['completed', 'completed', 'completed', 'completed', 'shipped', 'processing', 'cancelled']
  const channels = ['website', 'website', 'website', 'amazon', 'amazon', 'fnac', 'retail']
  
  for (let i = 0; i < 500; i++) {
    const daysAgo = Math.floor(Math.random() * 180)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]
    const quantity = Math.floor(Math.random() * 3) + 1
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const channel = channels[Math.floor(Math.random() * channels.length)]
    
    orders.push({
      order_number: `ORD-${2024}${String(i + 1).padStart(5, '0')}`,
      product_sku: product.sku,
      product_name: product.name,
      quantity,
      unit_price: product.price,
      total_price: product.price * quantity,
      cost: product.cost * quantity,
      margin: (product.price - product.cost) * quantity,
      status,
      channel,
      customer_email: `client${i}@example.com`,
      created_at: date.toISOString()
    })
  }
  
  return orders
}

// Générer des mouvements de stock
function generateStockMovements() {
  const movements = []
  const types = ['sale', 'sale', 'sale', 'purchase', 'return', 'adjustment', 'loss']
  
  for (let i = 0; i < 800; i++) {
    const daysAgo = Math.floor(Math.random() * 180)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    let quantity = Math.floor(Math.random() * 10) + 1
    
    // Les ventes et pertes sont négatives
    if (type === 'sale' || type === 'loss') {
      quantity = -quantity
    }
    
    movements.push({
      product_sku: product.sku,
      product_name: product.name,
      movement_type: type,
      quantity,
      unit_cost: product.cost,
      total_value: Math.abs(quantity) * product.cost,
      reference: type === 'sale' ? `ORD-${Math.floor(Math.random() * 10000)}` : type === 'purchase' ? `PO-${Math.floor(Math.random() * 1000)}` : null,
      notes: type === 'loss' ? 'Produit endommagé' : type === 'adjustment' ? 'Inventaire' : null,
      created_at: date.toISOString()
    })
  }
  
  return movements
}

export async function POST() {
  try {
    const supabase = createServerClient()

    // Vider les tables existantes
    await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insérer les produits
    const { error: prodError } = await supabase
      .from('products')
      .insert(PRODUCTS as any)

    if (prodError) {
      console.error('Erreur produits:', prodError)
    }

    // Insérer les commandes par lots
    const orders = generateOrders()
    for (let i = 0; i < orders.length; i += 100) {
      const batch = orders.slice(i, i + 100)
      const { error } = await supabase.from('orders').insert(batch as any)
      if (error) console.error('Erreur orders batch:', error)
    }

    // Insérer les mouvements de stock par lots
    const movements = generateStockMovements()
    for (let i = 0; i < movements.length; i += 100) {
      const batch = movements.slice(i, i + 100)
      const { error } = await supabase.from('stock_movements').insert(batch as any)
      if (error) console.error('Erreur movements batch:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Données de test créées !',
      stats: {
        products: PRODUCTS.length,
        orders: orders.length,
        movements: movements.length
      }
    })

  } catch (error) {
    console.error('Erreur création données test:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createServerClient()

    // Récupérer les stats
    const [products, orders, movements] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('stock_movements').select('*')
    ])

    // Calculer des métriques
    const productsData = products.data || []
    const ordersData = orders.data || []
    const movementsData = movements.data || []

    // Stock total et valeur
    const totalStock = productsData.reduce((sum, p: any) => sum + p.stock, 0)
    const stockValue = productsData.reduce((sum, p: any) => sum + (p.stock * p.cost), 0)

    // Produits en rupture ou alerte
    const lowStock = productsData.filter((p: any) => p.stock <= p.min_stock)
    const outOfStock = productsData.filter((p: any) => p.stock === 0)

    // Chiffre d'affaires
    const revenue = ordersData
      .filter((o: any) => o.status === 'completed')
      .reduce((sum, o: any) => sum + parseFloat(o.total_price), 0)

    const totalMargin = ordersData
      .filter((o: any) => o.status === 'completed')
      .reduce((sum, o: any) => sum + parseFloat(o.margin), 0)

    // Produit le plus vendu
    const salesByProduct: Record<string, number> = {}
    ordersData.filter((o: any) => o.status === 'completed').forEach((o: any) => {
      salesByProduct[o.product_name] = (salesByProduct[o.product_name] || 0) + o.quantity
    })
    const topProduct = Object.entries(salesByProduct)
      .sort((a, b) => b[1] - a[1])[0]

    // Stock mort (pas de mouvement depuis 60+ jours)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    const recentMovements = new Set(
      movementsData
        .filter((m: any) => new Date(m.created_at) > sixtyDaysAgo)
        .map((m: any) => m.product_sku)
    )
    const deadStock = productsData.filter((p: any) => !recentMovements.has(p.sku) && p.stock > 0)

    return NextResponse.json({
      success: true,
      data: {
        products: productsData,
        summary: {
          totalProducts: productsData.length,
          totalOrders: ordersData.length,
          totalStock,
          stockValue: Math.round(stockValue),
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
          deadStockCount: deadStock.length,
          revenue: Math.round(revenue),
          margin: Math.round(totalMargin),
          marginRate: revenue > 0 ? Math.round((totalMargin / revenue) * 100) : 0,
          topProduct: topProduct ? { name: topProduct[0], quantity: topProduct[1] } : null,
          lowStockProducts: lowStock.map((p: any) => ({ name: p.name, stock: p.stock, minStock: p.min_stock })),
          deadStockProducts: deadStock.map((p: any) => ({ name: p.name, stock: p.stock, value: p.stock * p.cost }))
        }
      }
    })

  } catch (error) {
    console.error('Erreur récupération stats:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

