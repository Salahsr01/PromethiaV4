/**
 * Service de détection d'anomalies
 * 
 * Utilise plusieurs méthodes statistiques pour identifier
 * les valeurs aberrantes et les tendances anormales.
 */

import { DataPoint, DataSeries, Anomaly, DescriptiveStats } from './analytics'

function generateId(): string {
  return `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export class AnomalyDetector {
  private defaultThreshold = 2.5  // Nombre d'écarts-types
  
  /**
   * Détecte les anomalies dans une série de données
   */
  detectAnomalies(
    series: DataSeries, 
    options?: { 
      threshold?: number
      method?: 'zscore' | 'iqr' | 'isolation' | 'combined'
    }
  ): Anomaly[] {
    const { threshold = this.defaultThreshold, method = 'combined' } = options || {}
    const anomalies: Anomaly[] = []
    
    if (series.data.length < 5) return anomalies
    
    const stats = this.calculateStats(series.data)
    
    switch (method) {
      case 'zscore':
        anomalies.push(...this.detectByZScore(series, stats, threshold))
        break
      case 'iqr':
        anomalies.push(...this.detectByIQR(series, stats))
        break
      case 'isolation':
        anomalies.push(...this.detectByIsolation(series))
        break
      case 'combined':
      default:
        // Combiner plusieurs méthodes pour plus de robustesse
        const zscoreAnomalies = this.detectByZScore(series, stats, threshold)
        const iqrAnomalies = this.detectByIQR(series, stats)
        const trendAnomalies = this.detectTrendBreaks(series)
        
        // Fusionner et dédupliquer
        anomalies.push(...this.mergeAnomalies([
          ...zscoreAnomalies,
          ...iqrAnomalies,
          ...trendAnomalies
        ]))
    }
    
    // Ajouter la détection des valeurs manquantes
    anomalies.push(...this.detectMissingValues(series))
    
    return anomalies.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }
  
  /**
   * Calcule les statistiques descriptives
   */
  calculateStats(data: DataPoint[]): DescriptiveStats {
    const values = data.map(d => d.value).sort((a, b) => a - b)
    const n = values.length
    
    const sum = values.reduce((a, b) => a + b, 0)
    const mean = sum / n
    
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n
    const standardDeviation = Math.sqrt(variance)
    
    const median = n % 2 === 0
      ? (values[n/2 - 1] + values[n/2]) / 2
      : values[Math.floor(n/2)]
    
    // Calcul des moments d'ordre supérieur
    const m3 = values.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n
    const m4 = values.reduce((acc, v) => acc + Math.pow(v - mean, 4), 0) / n
    
    const skewness = m3 / Math.pow(standardDeviation, 3)
    const kurtosis = m4 / Math.pow(standardDeviation, 4) - 3
    
    return {
      count: n,
      min: values[0],
      max: values[n - 1],
      mean,
      median,
      standardDeviation,
      variance,
      skewness,
      kurtosis,
      percentiles: {
        p25: this.percentile(values, 25),
        p50: median,
        p75: this.percentile(values, 75),
        p90: this.percentile(values, 90),
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99)
      }
    }
  }
  
  /**
   * Calcule un percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    const index = (p / 100) * (sortedValues.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    
    if (lower === upper) return sortedValues[lower]
    
    return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower)
  }
  
  /**
   * Détection par Z-Score (écarts-types)
   */
  private detectByZScore(
    series: DataSeries, 
    stats: DescriptiveStats, 
    threshold: number
  ): Anomaly[] {
    const anomalies: Anomaly[] = []
    
    for (const point of series.data) {
      const zscore = Math.abs((point.value - stats.mean) / stats.standardDeviation)
      
      if (zscore > threshold) {
        const deviation = ((point.value - stats.mean) / stats.mean) * 100
        const isSpike = point.value > stats.mean
        
        anomalies.push({
          id: generateId(),
          timestamp: new Date(point.timestamp),
          value: point.value,
          expectedValue: stats.mean,
          deviation,
          severity: this.getSeverity(zscore),
          type: isSpike ? 'spike' : 'drop',
          confidence: Math.min(0.99, 0.5 + zscore * 0.1),
          description: `Valeur ${isSpike ? 'anormalement haute' : 'anormalement basse'}: ${point.value.toFixed(2)} (attendu: ~${stats.mean.toFixed(2)})`,
          suggestedAction: isSpike 
            ? 'Vérifier la source de cette augmentation inhabituelle'
            : 'Investiguer la cause de cette baisse'
        })
      }
    }
    
    return anomalies
  }
  
  /**
   * Détection par IQR (Interquartile Range)
   */
  private detectByIQR(series: DataSeries, stats: DescriptiveStats): Anomaly[] {
    const anomalies: Anomaly[] = []
    
    const iqr = stats.percentiles.p75 - stats.percentiles.p25
    const lowerBound = stats.percentiles.p25 - 1.5 * iqr
    const upperBound = stats.percentiles.p75 + 1.5 * iqr
    
    for (const point of series.data) {
      if (point.value < lowerBound || point.value > upperBound) {
        const isOutlierHigh = point.value > upperBound
        const expectedValue = isOutlierHigh ? upperBound : lowerBound
        const deviation = ((point.value - stats.median) / stats.median) * 100
        
        anomalies.push({
          id: generateId(),
          timestamp: new Date(point.timestamp),
          value: point.value,
          expectedValue,
          deviation,
          severity: this.getSeverityFromDeviation(Math.abs(deviation)),
          type: 'outlier',
          confidence: 0.75,
          description: `Valeur hors limites: ${point.value.toFixed(2)} (limites: ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`,
          suggestedAction: 'Vérifier si cette valeur est correcte ou résulte d\'une erreur'
        })
      }
    }
    
    return anomalies
  }
  
  /**
   * Détection par isolation (simplifié)
   */
  private detectByIsolation(series: DataSeries): Anomaly[] {
    const anomalies: Anomaly[] = []
    const values = series.data.map(d => d.value)
    
    // Calculer la "distance" de chaque point par rapport à ses voisins
    for (let i = 1; i < series.data.length - 1; i++) {
      const prev = values[i - 1]
      const curr = values[i]
      const next = values[i + 1]
      
      const expectedValue = (prev + next) / 2
      const localDeviation = Math.abs(curr - expectedValue)
      const avgValue = (prev + curr + next) / 3
      const relativeDeviation = (localDeviation / avgValue) * 100
      
      if (relativeDeviation > 50) { // Plus de 50% de déviation locale
        anomalies.push({
          id: generateId(),
          timestamp: new Date(series.data[i].timestamp),
          value: curr,
          expectedValue,
          deviation: relativeDeviation,
          severity: this.getSeverityFromDeviation(relativeDeviation),
          type: curr > expectedValue ? 'spike' : 'drop',
          confidence: 0.7,
          description: `Point isolé: ${curr.toFixed(2)} (voisins: ${prev.toFixed(2)}, ${next.toFixed(2)})`,
          suggestedAction: 'Ce point semble incohérent avec son contexte immédiat'
        })
      }
    }
    
    return anomalies
  }
  
  /**
   * Détecte les ruptures de tendance
   */
  private detectTrendBreaks(series: DataSeries): Anomaly[] {
    const anomalies: Anomaly[] = []
    const windowSize = Math.min(5, Math.floor(series.data.length / 3))
    
    if (series.data.length < windowSize * 2) return anomalies
    
    for (let i = windowSize; i < series.data.length - windowSize; i++) {
      const beforeWindow = series.data.slice(i - windowSize, i)
      const afterWindow = series.data.slice(i, i + windowSize)
      
      const beforeTrend = this.calculateTrendSlope(beforeWindow)
      const afterTrend = this.calculateTrendSlope(afterWindow)
      
      // Changement significatif de direction
      if (beforeTrend * afterTrend < 0 && 
          Math.abs(beforeTrend - afterTrend) > 0.1) {
        const point = series.data[i]
        
        anomalies.push({
          id: generateId(),
          timestamp: new Date(point.timestamp),
          value: point.value,
          expectedValue: point.value, // La valeur elle-même n'est pas anormale
          deviation: 0,
          severity: 'medium',
          type: 'trend_break',
          confidence: 0.65,
          description: `Changement de tendance détecté: ${beforeTrend > 0 ? 'hausse' : 'baisse'} → ${afterTrend > 0 ? 'hausse' : 'baisse'}`,
          suggestedAction: 'Analyser les facteurs ayant causé ce changement de direction'
        })
      }
    }
    
    return anomalies
  }
  
  /**
   * Calcule la pente de tendance
   */
  private calculateTrendSlope(data: DataPoint[]): number {
    const n = data.length
    if (n < 2) return 0
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    
    for (let i = 0; i < n; i++) {
      sumX += i
      sumY += data[i].value
      sumXY += i * data[i].value
      sumX2 += i * i
    }
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  }
  
  /**
   * Détecte les valeurs manquantes
   */
  private detectMissingValues(series: DataSeries): Anomaly[] {
    const anomalies: Anomaly[] = []
    
    // Calculer l'intervalle moyen entre les points
    const intervals: number[] = []
    for (let i = 1; i < series.data.length; i++) {
      const prev = new Date(series.data[i-1].timestamp).getTime()
      const curr = new Date(series.data[i].timestamp).getTime()
      intervals.push(curr - prev)
    }
    
    if (intervals.length === 0) return anomalies
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    
    // Détecter les gaps significatifs
    for (let i = 1; i < series.data.length; i++) {
      const prev = new Date(series.data[i-1].timestamp).getTime()
      const curr = new Date(series.data[i].timestamp).getTime()
      const interval = curr - prev
      
      if (interval > avgInterval * 2) {
        const missingCount = Math.round(interval / avgInterval) - 1
        
        anomalies.push({
          id: generateId(),
          timestamp: new Date(prev + avgInterval),
          value: 0,
          expectedValue: (series.data[i-1].value + series.data[i].value) / 2,
          deviation: 100,
          severity: missingCount > 3 ? 'high' : 'medium',
          type: 'missing',
          confidence: 0.9,
          description: `~${missingCount} valeur(s) manquante(s) entre ${new Date(prev).toLocaleDateString()} et ${new Date(curr).toLocaleDateString()}`,
          suggestedAction: 'Vérifier la source de données pour cette période'
        })
      }
    }
    
    return anomalies
  }
  
  /**
   * Fusionne les anomalies détectées par différentes méthodes
   */
  private mergeAnomalies(anomalies: Anomaly[]): Anomaly[] {
    const merged: Map<string, Anomaly> = new Map()
    
    for (const anomaly of anomalies) {
      const key = `${new Date(anomaly.timestamp).toISOString()}-${anomaly.type}`
      const existing = merged.get(key)
      
      if (existing) {
        // Garder celui avec la plus haute confiance
        if (anomaly.confidence > existing.confidence) {
          merged.set(key, {
            ...anomaly,
            confidence: Math.min(0.99, anomaly.confidence + 0.1) // Bonus pour détection multiple
          })
        }
      } else {
        merged.set(key, anomaly)
      }
    }
    
    return [...merged.values()]
  }
  
  /**
   * Détermine la sévérité basée sur le z-score
   */
  private getSeverity(zscore: number): Anomaly['severity'] {
    if (zscore > 4) return 'critical'
    if (zscore > 3) return 'high'
    if (zscore > 2.5) return 'medium'
    return 'low'
  }
  
  /**
   * Détermine la sévérité basée sur la déviation en %
   */
  private getSeverityFromDeviation(deviation: number): Anomaly['severity'] {
    if (deviation > 100) return 'critical'
    if (deviation > 75) return 'high'
    if (deviation > 50) return 'medium'
    return 'low'
  }
}

export function createAnomalyDetector(): AnomalyDetector {
  return new AnomalyDetector()
}

export default AnomalyDetector

