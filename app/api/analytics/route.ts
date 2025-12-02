import { NextRequest, NextResponse } from 'next/server'
import { createAnomalyDetector, createInsightGenerator, createPredictionEngine } from '@/app/lib/analytics'
import { supabase } from '@/app/lib/supabase'

/**
 * API Analytics
 * Génère des insights, détecte les anomalies, fait des prédictions
 */
export async function POST(request: NextRequest) {
  try {
    const { action, data, seriesName = 'data' } = await request.json()
    
    // Formater les données pour l'analyse
    const series = {
      id: seriesName,
      name: seriesName,
      data: data.map((d: any, i: number) => ({
        timestamp: d.date || d.timestamp || new Date(Date.now() - (data.length - i) * 86400000),
        value: d.value || d.amount || d.quantity || 0
      }))
    }
    
    const anomalyDetector = createAnomalyDetector()
    const insightGenerator = createInsightGenerator()
    const predictionEngine = createPredictionEngine()
    
    let result: any = {}
    
    switch (action) {
      case 'anomalies':
        result.anomalies = anomalyDetector.detectAnomalies(series)
        break
        
      case 'insights':
        result.insights = insightGenerator.generateInsights(series)
        break
        
      case 'predictions':
        result.predictions = predictionEngine.predict(series)
        result.trend = predictionEngine.analyzeTrend(series)
        break
        
      case 'full':
      default:
        result.anomalies = anomalyDetector.detectAnomalies(series)
        result.insights = insightGenerator.generateInsights(series)
        result.predictions = predictionEngine.predict(series, { horizon: 3 })
        result.trend = predictionEngine.analyzeTrend(series)
        result.stats = anomalyDetector.calculateStats(series.data)
        break
    }
    
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Erreur analytics:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * GET - Analyse les données de stock depuis Supabase
 */
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') || 'stock'
    
    const anomalyDetector = createAnomalyDetector()
    const insightGenerator = createInsightGenerator()
    
    if (type === 'stock') {
      // Récupérer les données de stock
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (!products || products.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Aucune donnée de stock',
          insights: [],
          anomalies: []
        })
      }
      
      // Analyser les niveaux de stock
      const stockSeries = {
        id: 'stock',
        name: 'Niveau de Stock',
        data: products.map((p: any) => ({
          timestamp: new Date(),
          value: Number(p.stock || 0)
        }))
      }

      const insights = insightGenerator.generateInsights(stockSeries)
      const anomalies = anomalyDetector.detectAnomalies(stockSeries)
      
      // Alertes de stock bas
      const lowStockAlerts = products
        .filter((p: any) => p.stock < p.min_stock)
        .map((p: any) => ({
          productId: p.id,
          productName: p.name,
          currentStock: p.stock,
          minStock: p.min_stock,
          severity: p.stock === 0 ? 'critical' : p.stock < p.min_stock / 2 ? 'high' : 'medium'
        }))
      
      return NextResponse.json({
        success: true,
        insights,
        anomalies,
        lowStockAlerts,
        summary: {
          totalProducts: products.length,
          lowStockCount: lowStockAlerts.length,
          outOfStockCount: lowStockAlerts.filter(a => a.currentStock === 0).length
        }
      })
    }
    
    if (type === 'sales') {
      // Récupérer les commandes
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: true })
      
      if (!orders || orders.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Aucune donnée de ventes',
          insights: [],
          anomalies: []
        })
      }
      
      const salesSeries = {
        id: 'sales',
        name: 'Ventes',
        data: orders.map((o: any) => ({
          timestamp: new Date(o.order_date || Date.now()),
          value: Number(o.total_price || 0)
        }))
      }
      
      const insights = insightGenerator.generateInsights(salesSeries)
      const anomalies = anomalyDetector.detectAnomalies(salesSeries)
      
      return NextResponse.json({
        success: true,
        insights,
        anomalies,
        summary: {
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum, o: any) => sum + Number(o.total_price || 0), 0)
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Type non supporté'
    }, { status: 400 })
    
  } catch (error: any) {
    console.error('Erreur analytics GET:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

