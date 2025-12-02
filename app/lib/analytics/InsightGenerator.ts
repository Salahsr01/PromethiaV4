/**
 * Générateur d'insights automatiques
 * 
 * Analyse les données et génère des insights business
 * compréhensibles et actionnables.
 */

import { 
  DataSeries, 
  Insight, 
  ExecutiveSummary, 
  Anomaly, 
  Prediction, 
  Trend,
  DescriptiveStats
} from './analytics'
import { AnomalyDetector } from './AnomalyDetector'
import { PredictionEngine } from './PredictionEngine'

function generateId(): string {
  return `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export class InsightGenerator {
  private anomalyDetector = new AnomalyDetector()
  private predictionEngine = new PredictionEngine()
  
  /**
   * Génère tous les insights pour une série de données
   */
  generateInsights(
    series: DataSeries,
    options?: {
      includeAnomalies?: boolean
      includePredictions?: boolean
      includeTrends?: boolean
      includeComparisons?: boolean
    }
  ): Insight[] {
    const {
      includeAnomalies = true,
      includePredictions = true,
      includeTrends = true,
      includeComparisons = true
    } = options || {}
    
    const insights: Insight[] = []
    
    // Analyser les données
    const stats = this.anomalyDetector.calculateStats(series.data)
    const trend = this.predictionEngine.analyzeTrend(series)
    
    // Insights de tendance
    if (includeTrends) {
      insights.push(...this.generateTrendInsights(series, trend, stats))
    }
    
    // Insights d'anomalies
    if (includeAnomalies) {
      const anomalies = this.anomalyDetector.detectAnomalies(series)
      insights.push(...this.generateAnomalyInsights(anomalies))
    }
    
    // Insights de prédiction
    if (includePredictions) {
      const predictions = this.predictionEngine.predict(series)
      insights.push(...this.generatePredictionInsights(predictions, series))
    }
    
    // Insights de comparaison
    if (includeComparisons) {
      insights.push(...this.generateComparisonInsights(series, stats))
    }
    
    // Recommandations basées sur l'ensemble
    insights.push(...this.generateRecommendations(series, trend, stats))
    
    return insights.sort((a, b) => {
      const priorityOrder = { critical: 0, action: 1, warning: 2, info: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
  
  /**
   * Génère les insights de tendance
   */
  private generateTrendInsights(
    series: DataSeries,
    trend: Trend,
    stats: DescriptiveStats
  ): Insight[] {
    const insights: Insight[] = []
    const values = series.data.map(d => d.value)
    const lastValue = values[values.length - 1]
    const firstValue = values[0]
    const totalChange = ((lastValue - firstValue) / firstValue) * 100
    
    // Insight principal de tendance
    if (trend.direction !== 'stable') {
      const isPositive = trend.direction === 'increasing'
      
      insights.push({
        id: generateId(),
        type: 'trend',
        priority: Math.abs(totalChange) > 50 ? 'action' : 'info',
        title: isPositive 
          ? `📈 Croissance de ${Math.abs(totalChange).toFixed(1)}%`
          : `📉 Baisse de ${Math.abs(totalChange).toFixed(1)}%`,
        description: isPositive
          ? `${series.name} a augmenté de ${firstValue.toFixed(0)} à ${lastValue.toFixed(0)} sur la période analysée.`
          : `${series.name} a diminué de ${firstValue.toFixed(0)} à ${lastValue.toFixed(0)} sur la période analysée.`,
        metrics: [
          { name: 'Valeur initiale', value: firstValue, trend: 'stable' },
          { name: 'Valeur actuelle', value: lastValue, change: totalChange, trend: isPositive ? 'up' : 'down' },
          { name: 'Fiabilité tendance', value: `${(trend.rSquared * 100).toFixed(0)}%` }
        ],
        actions: isPositive
          ? [{ label: 'Maintenir la dynamique', type: 'monitor' }]
          : [{ label: 'Investiguer les causes', type: 'investigate' }],
        generatedAt: new Date()
      })
    }
    
    // Insight d'accélération
    if (Math.abs(trend.acceleration) > 0.05) {
      const isAccelerating = trend.acceleration > 0
      
      insights.push({
        id: generateId(),
        type: 'trend',
        priority: 'warning',
        title: isAccelerating ? '🚀 Accélération détectée' : '🐢 Ralentissement détecté',
        description: isAccelerating
          ? `La croissance de ${series.name} s'accélère. Le taux de changement augmente.`
          : `La croissance de ${series.name} ralentit. Le momentum diminue.`,
        metrics: [
          { name: 'Taux de changement', value: `${(trend.changeRate * 100).toFixed(1)}%/période` },
          { name: 'Accélération', value: `${(trend.acceleration * 100).toFixed(2)}%` }
        ],
        generatedAt: new Date()
      })
    }
    
    // Insight de volatilité
    if (trend.direction === 'volatile') {
      insights.push({
        id: generateId(),
        type: 'trend',
        priority: 'warning',
        title: '⚡ Forte volatilité',
        description: `${series.name} présente des variations importantes. L'écart-type est de ${stats.standardDeviation.toFixed(2)}.`,
        metrics: [
          { name: 'Moyenne', value: stats.mean },
          { name: 'Écart-type', value: stats.standardDeviation },
          { name: 'Coefficient de variation', value: `${((stats.standardDeviation / stats.mean) * 100).toFixed(1)}%` }
        ],
        actions: [
          { label: 'Identifier les causes de volatilité', type: 'investigate' }
        ],
        generatedAt: new Date()
      })
    }
    
    // Insight de saisonnalité
    if (trend.seasonality?.detected) {
      insights.push({
        id: generateId(),
        type: 'trend',
        priority: 'info',
        title: '🔄 Pattern saisonnier détecté',
        description: `Un cycle de ~${trend.seasonality.period} jours a été identifié dans ${series.name}.`,
        metrics: [
          { name: 'Période du cycle', value: `${trend.seasonality.period} jours` },
          { name: 'Amplitude', value: `${(trend.seasonality.amplitude * 100).toFixed(0)}%` }
        ],
        generatedAt: new Date()
      })
    }
    
    return insights
  }
  
  /**
   * Génère les insights d'anomalies
   */
  private generateAnomalyInsights(anomalies: Anomaly[]): Insight[] {
    const insights: Insight[] = []
    
    if (anomalies.length === 0) return insights
    
    // Grouper par sévérité
    const critical = anomalies.filter(a => a.severity === 'critical')
    const high = anomalies.filter(a => a.severity === 'high')
    
    if (critical.length > 0) {
      insights.push({
        id: generateId(),
        type: 'anomaly',
        priority: 'critical',
        title: `🚨 ${critical.length} anomalie(s) critique(s)`,
        description: critical.map(a => a.description).join('. '),
        metrics: critical.slice(0, 3).map(a => ({
          name: new Date(a.timestamp).toLocaleDateString(),
          value: a.value,
          change: a.deviation
        })),
        actions: [
          { label: 'Investiguer immédiatement', type: 'investigate' }
        ],
        generatedAt: new Date()
      })
    }
    
    if (high.length > 0 && critical.length === 0) {
      insights.push({
        id: generateId(),
        type: 'anomaly',
        priority: 'action',
        title: `⚠️ ${high.length} anomalie(s) importante(s)`,
        description: high.map(a => a.description).slice(0, 2).join('. '),
        metrics: high.slice(0, 3).map(a => ({
          name: new Date(a.timestamp).toLocaleDateString(),
          value: a.value,
          change: a.deviation
        })),
        actions: [
          { label: 'Vérifier les données', type: 'investigate' }
        ],
        generatedAt: new Date()
      })
    }
    
    // Résumé des anomalies
    if (anomalies.length > 3) {
      const types = new Map<string, number>()
      anomalies.forEach(a => types.set(a.type, (types.get(a.type) || 0) + 1))
      
      insights.push({
        id: generateId(),
        type: 'anomaly',
        priority: 'info',
        title: `📊 ${anomalies.length} anomalies détectées au total`,
        description: `Types: ${[...types.entries()].map(([t, c]) => `${t} (${c})`).join(', ')}`,
        metrics: [
          { name: 'Total anomalies', value: anomalies.length },
          { name: 'Confiance moyenne', value: `${(anomalies.reduce((s, a) => s + a.confidence, 0) / anomalies.length * 100).toFixed(0)}%` }
        ],
        generatedAt: new Date()
      })
    }
    
    return insights
  }
  
  /**
   * Génère les insights de prédiction
   */
  private generatePredictionInsights(predictions: Prediction[], series: DataSeries): Insight[] {
    const insights: Insight[] = []
    
    if (predictions.length === 0) return insights
    
    const lastValue = series.data[series.data.length - 1].value
    const lastPrediction = predictions[predictions.length - 1]
    const expectedChange = ((lastPrediction.predictedValue - lastValue) / lastValue) * 100
    
    insights.push({
      id: generateId(),
      type: 'prediction',
      priority: Math.abs(expectedChange) > 20 ? 'action' : 'info',
      title: expectedChange > 0 
        ? `🔮 Hausse prévue de ${expectedChange.toFixed(1)}%`
        : `🔮 Baisse prévue de ${Math.abs(expectedChange).toFixed(1)}%`,
      description: `D'ici ${predictions.length} période(s), ${series.name} devrait atteindre ${lastPrediction.predictedValue.toFixed(0)} (intervalle: ${lastPrediction.lowerBound.toFixed(0)} - ${lastPrediction.upperBound.toFixed(0)}).`,
      metrics: [
        { name: 'Valeur actuelle', value: lastValue },
        { name: 'Valeur prévue', value: lastPrediction.predictedValue, change: expectedChange },
        { name: 'Confiance', value: `${(lastPrediction.confidence * 100).toFixed(0)}%` }
      ],
      actions: expectedChange > 0
        ? [{ label: 'Préparer la croissance', type: 'adjust' }]
        : [{ label: 'Anticiper la baisse', type: 'adjust' }],
      generatedAt: new Date(),
      expiresAt: lastPrediction.targetDate
    })
    
    // Facteurs influents
    if (lastPrediction.factors.length > 0) {
      const topFactors = lastPrediction.factors
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
        .slice(0, 3)
      
      insights.push({
        id: generateId(),
        type: 'prediction',
        priority: 'info',
        title: '📈 Facteurs clés de la prédiction',
        description: `Les principaux facteurs influençant la prévision sont: ${topFactors.map(f => f.name).join(', ')}.`,
        metrics: topFactors.map(f => ({
          name: f.name,
          value: `${(f.impact * 100).toFixed(1)}%`,
          trend: f.impact > 0 ? 'up' as const : 'down' as const
        })),
        generatedAt: new Date()
      })
    }
    
    return insights
  }
  
  /**
   * Génère les insights de comparaison
   */
  private generateComparisonInsights(
    series: DataSeries,
    stats: DescriptiveStats
  ): Insight[] {
    const insights: Insight[] = []
    const values = series.data.map(d => d.value)
    const n = values.length
    
    if (n < 10) return insights
    
    // Comparer première et seconde moitié
    const firstHalf = values.slice(0, Math.floor(n/2))
    const secondHalf = values.slice(Math.floor(n/2))
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    const periodChange = ((secondAvg - firstAvg) / firstAvg) * 100
    
    insights.push({
      id: generateId(),
      type: 'comparison',
      priority: Math.abs(periodChange) > 30 ? 'action' : 'info',
      title: periodChange > 0 
        ? `📊 Amélioration de ${periodChange.toFixed(1)}% sur la période`
        : `📊 Recul de ${Math.abs(periodChange).toFixed(1)}% sur la période`,
      description: `La moyenne de ${series.name} est passée de ${firstAvg.toFixed(0)} à ${secondAvg.toFixed(0)} entre la première et la seconde moitié de la période.`,
      metrics: [
        { name: 'Moyenne 1ère moitié', value: firstAvg },
        { name: 'Moyenne 2ème moitié', value: secondAvg, change: periodChange }
      ],
      generatedAt: new Date()
    })
    
    // Comparer avec les extremums
    const currentValue = values[values.length - 1]
    const distanceFromMax = ((stats.max - currentValue) / stats.max) * 100
    const distanceFromMin = ((currentValue - stats.min) / stats.min) * 100
    
    if (distanceFromMax < 10) {
      insights.push({
        id: generateId(),
        type: 'comparison',
        priority: 'action',
        title: '🏆 Proche du maximum historique',
        description: `${series.name} est à ${distanceFromMax.toFixed(1)}% de son plus haut niveau (${stats.max.toFixed(0)}).`,
        metrics: [
          { name: 'Valeur actuelle', value: currentValue },
          { name: 'Maximum', value: stats.max }
        ],
        actions: [{ label: 'Capitaliser sur ce succès', type: 'celebrate' }],
        generatedAt: new Date()
      })
    }
    
    if (distanceFromMin < 20 && stats.min > 0) {
      insights.push({
        id: generateId(),
        type: 'comparison',
        priority: 'warning',
        title: '⚠️ Proche du minimum historique',
        description: `${series.name} n'est qu'à ${distanceFromMin.toFixed(1)}% au-dessus de son plus bas niveau (${stats.min.toFixed(0)}).`,
        metrics: [
          { name: 'Valeur actuelle', value: currentValue },
          { name: 'Minimum', value: stats.min }
        ],
        actions: [{ label: 'Investiguer les causes', type: 'investigate' }],
        generatedAt: new Date()
      })
    }
    
    return insights
  }
  
  /**
   * Génère des recommandations basées sur l'analyse
   */
  private generateRecommendations(
    series: DataSeries,
    trend: Trend,
    stats: DescriptiveStats
  ): Insight[] {
    const insights: Insight[] = []
    const recommendations: string[] = []
    
    // Recommandations basées sur la tendance
    if (trend.direction === 'increasing' && trend.rSquared > 0.7) {
      recommendations.push('Maintenir les facteurs de croissance actuels')
    } else if (trend.direction === 'decreasing') {
      recommendations.push('Identifier et corriger les causes de la baisse')
    }
    
    // Recommandations basées sur la volatilité
    if (trend.direction === 'volatile') {
      recommendations.push('Mettre en place des mécanismes de stabilisation')
    }
    
    // Recommandations basées sur la saisonnalité
    if (trend.seasonality?.detected) {
      recommendations.push(`Planifier en fonction du cycle de ${trend.seasonality.period} jours`)
    }
    
    // Recommandations basées sur la position actuelle
    const lastValue = series.data[series.data.length - 1].value
    const percentile = this.calculatePercentile(lastValue, series.data.map(d => d.value))
    
    if (percentile > 90) {
      recommendations.push('Préparer des scénarios de consolidation')
    } else if (percentile < 10) {
      recommendations.push('Envisager des actions de redressement')
    }
    
    if (recommendations.length > 0) {
      insights.push({
        id: generateId(),
        type: 'recommendation',
        priority: 'action',
        title: '💡 Recommandations',
        description: recommendations.join('. ') + '.',
        metrics: [
          { name: 'Position actuelle', value: `Percentile ${percentile.toFixed(0)}` }
        ],
        actions: recommendations.map(r => ({ label: r, type: 'adjust' as const })),
        generatedAt: new Date()
      })
    }
    
    return insights
  }
  
  /**
   * Calcule le percentile d'une valeur
   */
  private calculatePercentile(value: number, allValues: number[]): number {
    const sorted = [...allValues].sort((a, b) => a - b)
    const index = sorted.findIndex(v => v >= value)
    return (index / sorted.length) * 100
  }
  
  /**
   * Génère un résumé exécutif complet
   */
  generateExecutiveSummary(
    series: DataSeries[],
    period?: { start: Date; end: Date }
  ): ExecutiveSummary {
    const insights: Insight[] = []
    const keyMetrics: ExecutiveSummary['keyMetrics'] = []
    const risks: ExecutiveSummary['risks'] = []
    const opportunities: ExecutiveSummary['opportunities'] = []
    const highlights: string[] = []
    
    for (const s of series) {
      const seriesInsights = this.generateInsights(s)
      insights.push(...seriesInsights)
      
      // Extraire les métriques clés
      const values = s.data.map(d => d.value)
      const lastValue = values[values.length - 1]
      const firstValue = values[0]
      const change = ((lastValue - firstValue) / firstValue) * 100
      
      keyMetrics.push({
        name: s.name,
        value: lastValue,
        change,
        status: change > 10 ? 'good' : change < -10 ? 'bad' : 'neutral'
      })
      
      // Identifier risques et opportunités
      const criticalInsights = seriesInsights.filter(i => i.priority === 'critical')
      if (criticalInsights.length > 0) {
        risks.push({
          description: `${s.name}: ${criticalInsights[0].title}`,
          probability: 'high',
          impact: 'high'
        })
      }
      
      const positiveInsights = seriesInsights.filter(i => 
        i.type === 'trend' && i.title.includes('Croissance')
      )
      if (positiveInsights.length > 0) {
        opportunities.push({
          description: `Capitaliser sur la croissance de ${s.name}`,
          potential: change,
          effort: 'low'
        })
      }
    }
    
    // Générer les highlights
    const topInsights = insights
      .sort((a, b) => {
        const order = { critical: 0, action: 1, warning: 2, info: 3 }
        return order[a.priority] - order[b.priority]
      })
      .slice(0, 5)
    
    topInsights.forEach(i => highlights.push(i.title))
    
    // Générer les recommandations
    const recommendations = insights
      .filter(i => i.type === 'recommendation')
      .flatMap(i => i.actions?.map(a => a.label) || [])
      .slice(0, 5)
    
    return {
      period: period || { 
        start: new Date(series[0]?.data[0]?.timestamp || new Date()), 
        end: new Date() 
      },
      highlights,
      keyMetrics,
      topInsights,
      risks,
      opportunities,
      recommendations
    }
  }
}

export function createInsightGenerator(): InsightGenerator {
  return new InsightGenerator()
}

export default InsightGenerator

