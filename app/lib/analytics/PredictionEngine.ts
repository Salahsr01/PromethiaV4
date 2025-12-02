/**
 * Moteur de prédiction
 * 
 * Utilise des modèles statistiques pour prévoir les valeurs futures
 * basées sur les données historiques.
 */

import { DataPoint, DataSeries, Prediction, Trend } from './analytics'

function generateId(): string {
  return `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export class PredictionEngine {
  /**
   * Génère des prédictions pour une série de données
   */
  predict(
    series: DataSeries,
    options?: {
      horizon?: number        // Nombre de périodes à prédire
      model?: 'linear' | 'polynomial' | 'exponential' | 'auto'
      confidenceLevel?: number // 0.9 = 90%
    }
  ): Prediction[] {
    const { 
      horizon = 5, 
      model = 'auto', 
      confidenceLevel = 0.95 
    } = options || {}
    
    if (series.data.length < 3) return []
    
    // Choisir le meilleur modèle si auto
    const selectedModel = model === 'auto' 
      ? this.selectBestModel(series) 
      : model
    
    const predictions: Prediction[] = []
    const trend = this.analyzeTrend(series)
    
    // Calculer l'intervalle moyen entre les points
    const intervals = this.calculateIntervals(series.data)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    
    // Dernier timestamp
    const lastTimestamp = new Date(series.data[series.data.length - 1].timestamp).getTime()
    
    for (let i = 1; i <= horizon; i++) {
      const targetDate = new Date(lastTimestamp + avgInterval * i)
      const predicted = this.predictValue(series, i, selectedModel)
      
      // Calculer l'intervalle de confiance
      const { lower, upper } = this.calculateConfidenceInterval(
        series,
        predicted,
        i,
        confidenceLevel
      )
      
      predictions.push({
        id: generateId(),
        targetDate,
        predictedValue: predicted,
        lowerBound: lower,
        upperBound: upper,
        confidence: this.calculatePredictionConfidence(series, i, trend),
        model: selectedModel,
        factors: this.identifyFactors(series, trend)
      })
    }
    
    return predictions
  }
  
  /**
   * Analyse la tendance d'une série
   */
  analyzeTrend(series: DataSeries): Trend {
    const values = series.data.map(d => d.value)
    const n = values.length
    
    // Régression linéaire
    const { slope, intercept, rSquared } = this.linearRegression(values)
    
    // Calculer le taux de changement moyen
    let totalChange = 0
    for (let i = 1; i < n; i++) {
      totalChange += (values[i] - values[i-1]) / values[i-1]
    }
    const changeRate = totalChange / (n - 1)
    
    // Calculer l'accélération (changement du taux de changement)
    const firstHalf = values.slice(0, Math.floor(n/2))
    const secondHalf = values.slice(Math.floor(n/2))
    
    const firstRate = this.calculateAverageChange(firstHalf)
    const secondRate = this.calculateAverageChange(secondHalf)
    const acceleration = secondRate - firstRate
    
    // Détecter la saisonnalité (simplifié)
    const seasonality = this.detectSeasonality(values)
    
    // Déterminer la direction
    let direction: Trend['direction']
    if (Math.abs(slope) < 0.01) {
      direction = 'stable'
    } else if (this.isVolatile(values)) {
      direction = 'volatile'
    } else {
      direction = slope > 0 ? 'increasing' : 'decreasing'
    }
    
    return {
      direction,
      slope,
      rSquared,
      changeRate,
      acceleration,
      seasonality
    }
  }
  
  /**
   * Régression linéaire simple
   */
  private linearRegression(values: number[]): {
    slope: number
    intercept: number
    rSquared: number
  } {
    const n = values.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
    
    for (let i = 0; i < n; i++) {
      sumX += i
      sumY += values[i]
      sumXY += i * values[i]
      sumX2 += i * i
      sumY2 += values[i] * values[i]
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Coefficient de détermination
    const yMean = sumY / n
    let ssTotal = 0, ssResidual = 0
    
    for (let i = 0; i < n; i++) {
      const predicted = intercept + slope * i
      ssTotal += Math.pow(values[i] - yMean, 2)
      ssResidual += Math.pow(values[i] - predicted, 2)
    }
    
    const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0
    
    return { slope, intercept, rSquared }
  }
  
  /**
   * Sélectionne le meilleur modèle basé sur les données
   */
  private selectBestModel(series: DataSeries): 'linear' | 'polynomial' | 'exponential' {
    const values = series.data.map(d => d.value)
    
    // Tester différents modèles et choisir celui avec le meilleur R²
    const linearR2 = this.linearRegression(values).rSquared
    const polyR2 = this.polynomialRegression(values, 2).rSquared
    const expR2 = this.exponentialFit(values).rSquared
    
    if (expR2 > linearR2 && expR2 > polyR2 && expR2 > 0.7) {
      return 'exponential'
    }
    if (polyR2 > linearR2 && polyR2 > 0.7) {
      return 'polynomial'
    }
    return 'linear'
  }
  
  /**
   * Régression polynomiale (degré 2)
   */
  private polynomialRegression(values: number[], degree: number = 2): {
    coefficients: number[]
    rSquared: number
  } {
    // Implémentation simplifiée pour degré 2
    const n = values.length
    let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0
    let sumY = 0, sumXY = 0, sumX2Y = 0
    
    for (let i = 0; i < n; i++) {
      const x = i, x2 = i*i, x3 = i*i*i, x4 = i*i*i*i
      sumX += x
      sumX2 += x2
      sumX3 += x3
      sumX4 += x4
      sumY += values[i]
      sumXY += x * values[i]
      sumX2Y += x2 * values[i]
    }
    
    // Résolution du système (simplifié)
    const a = ((sumX2Y * n - sumY * sumX2) - (sumXY * sumX - sumY * sumX) * (sumX3 * n - sumX * sumX2) / (sumX2 * n - sumX * sumX)) /
              ((sumX4 * n - sumX2 * sumX2) - (sumX3 * n - sumX * sumX2) * (sumX3 * n - sumX * sumX2) / (sumX2 * n - sumX * sumX))
    
    const b = (sumXY * n - sumY * sumX - a * (sumX3 * n - sumX * sumX2)) / (sumX2 * n - sumX * sumX)
    const c = (sumY - a * sumX2 - b * sumX) / n
    
    // Calculer R²
    const yMean = sumY / n
    let ssTotal = 0, ssResidual = 0
    
    for (let i = 0; i < n; i++) {
      const predicted = a * i * i + b * i + c
      ssTotal += Math.pow(values[i] - yMean, 2)
      ssResidual += Math.pow(values[i] - predicted, 2)
    }
    
    return {
      coefficients: [c, b, a],
      rSquared: ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0
    }
  }
  
  /**
   * Ajustement exponentiel
   */
  private exponentialFit(values: number[]): {
    a: number
    b: number
    rSquared: number
  } {
    // y = a * e^(b*x) → ln(y) = ln(a) + b*x
    const logValues = values.map(v => v > 0 ? Math.log(v) : 0)
    const { slope, intercept, rSquared } = this.linearRegression(logValues)
    
    return {
      a: Math.exp(intercept),
      b: slope,
      rSquared
    }
  }
  
  /**
   * Prédit une valeur future
   */
  private predictValue(
    series: DataSeries, 
    periodsAhead: number,
    model: 'linear' | 'polynomial' | 'exponential'
  ): number {
    const values = series.data.map(d => d.value)
    const n = values.length
    const x = n + periodsAhead - 1
    
    switch (model) {
      case 'linear': {
        const { slope, intercept } = this.linearRegression(values)
        return intercept + slope * x
      }
      case 'polynomial': {
        const { coefficients } = this.polynomialRegression(values, 2)
        return coefficients[0] + coefficients[1] * x + coefficients[2] * x * x
      }
      case 'exponential': {
        const { a, b } = this.exponentialFit(values)
        return a * Math.exp(b * x)
      }
      default:
        return values[values.length - 1]
    }
  }
  
  /**
   * Calcule l'intervalle de confiance
   */
  private calculateConfidenceInterval(
    series: DataSeries,
    predicted: number,
    periodsAhead: number,
    confidenceLevel: number
  ): { lower: number; upper: number } {
    const values = series.data.map(d => d.value)
    
    // Calculer l'erreur standard des résidus
    const { slope, intercept } = this.linearRegression(values)
    let sumSquaredResiduals = 0
    
    for (let i = 0; i < values.length; i++) {
      const predicted = intercept + slope * i
      sumSquaredResiduals += Math.pow(values[i] - predicted, 2)
    }
    
    const standardError = Math.sqrt(sumSquaredResiduals / (values.length - 2))
    
    // Z-score pour le niveau de confiance
    const zScore = this.getZScore(confidenceLevel)
    
    // L'incertitude augmente avec la distance de prédiction
    const uncertainty = standardError * zScore * Math.sqrt(1 + periodsAhead / values.length)
    
    return {
      lower: Math.max(0, predicted - uncertainty),
      upper: predicted + uncertainty
    }
  }
  
  /**
   * Retourne le z-score pour un niveau de confiance
   */
  private getZScore(confidenceLevel: number): number {
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    }
    return zScores[confidenceLevel] || 1.96
  }
  
  /**
   * Calcule la confiance de la prédiction
   */
  private calculatePredictionConfidence(
    series: DataSeries,
    periodsAhead: number,
    trend: Trend
  ): number {
    // La confiance diminue avec la distance et la volatilité
    const baseConfidence = trend.rSquared
    const distancePenalty = Math.pow(0.9, periodsAhead)
    const volatilityPenalty = trend.direction === 'volatile' ? 0.7 : 1
    
    return Math.max(0.1, baseConfidence * distancePenalty * volatilityPenalty)
  }
  
  /**
   * Identifie les facteurs contribuant à la prédiction
   */
  private identifyFactors(series: DataSeries, trend: Trend): Prediction['factors'] {
    const factors: Prediction['factors'] = []
    
    // Tendance historique
    factors.push({
      name: 'Tendance historique',
      impact: trend.rSquared * (trend.direction === 'increasing' ? 1 : -1)
    })
    
    // Momentum récent
    const recentValues = series.data.slice(-5).map(d => d.value)
    const recentTrend = this.calculateAverageChange(recentValues)
    factors.push({
      name: 'Momentum récent',
      impact: recentTrend
    })
    
    // Saisonnalité
    if (trend.seasonality?.detected) {
      factors.push({
        name: 'Effet saisonnier',
        impact: trend.seasonality.amplitude
      })
    }
    
    return factors
  }
  
  /**
   * Calcule les intervalles entre les points
   */
  private calculateIntervals(data: DataPoint[]): number[] {
    const intervals: number[] = []
    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i-1].timestamp).getTime()
      const curr = new Date(data[i].timestamp).getTime()
      intervals.push(curr - prev)
    }
    return intervals
  }
  
  /**
   * Calcule le changement moyen
   */
  private calculateAverageChange(values: number[]): number {
    if (values.length < 2) return 0
    
    let totalChange = 0
    for (let i = 1; i < values.length; i++) {
      if (values[i-1] !== 0) {
        totalChange += (values[i] - values[i-1]) / values[i-1]
      }
    }
    return totalChange / (values.length - 1)
  }
  
  /**
   * Vérifie si la série est volatile
   */
  private isVolatile(values: number[]): boolean {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length
    const cv = Math.sqrt(variance) / mean // Coefficient de variation
    
    return cv > 0.3 // Plus de 30% de variation
  }
  
  /**
   * Détecte la saisonnalité (simplifié)
   */
  private detectSeasonality(values: number[]): Trend['seasonality'] {
    if (values.length < 14) {
      return { detected: false, period: 0, amplitude: 0 }
    }
    
    // Autocorrélation simple pour détecter la périodicité
    const maxLag = Math.min(30, Math.floor(values.length / 2))
    let bestLag = 0
    let bestCorrelation = 0
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    
    for (let lag = 7; lag <= maxLag; lag++) {
      let correlation = 0
      let count = 0
      
      for (let i = 0; i < values.length - lag; i++) {
        correlation += (values[i] - mean) * (values[i + lag] - mean)
        count++
      }
      
      correlation /= count
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestLag = lag
      }
    }
    
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length
    const normalizedCorrelation = bestCorrelation / variance
    
    return {
      detected: normalizedCorrelation > 0.5,
      period: bestLag,
      amplitude: normalizedCorrelation
    }
  }
}

export function createPredictionEngine(): PredictionEngine {
  return new PredictionEngine()
}

export default PredictionEngine

