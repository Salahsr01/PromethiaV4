/**
 * Types pour le module d'analytics avancés
 */

// Point de données
export interface DataPoint {
  timestamp: Date | string
  value: number
  label?: string
  metadata?: Record<string, any>
}

// Série de données
export interface DataSeries {
  id: string
  name: string
  data: DataPoint[]
  unit?: string
  color?: string
}

// Anomalie détectée
export interface Anomaly {
  id: string
  timestamp: Date
  value: number
  expectedValue: number
  deviation: number           // Écart en pourcentage
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'spike' | 'drop' | 'outlier' | 'trend_break' | 'missing'
  confidence: number          // 0-1
  description: string
  suggestedAction?: string
}

// Prédiction
export interface Prediction {
  id: string
  targetDate: Date
  predictedValue: number
  lowerBound: number          // Intervalle de confiance bas
  upperBound: number          // Intervalle de confiance haut
  confidence: number          // 0-1
  model: 'linear' | 'polynomial' | 'exponential' | 'seasonal'
  factors: {
    name: string
    impact: number            // Contribution au résultat
  }[]
}

// Corrélation
export interface Correlation {
  id: string
  series1: string             // ID de la première série
  series2: string             // ID de la deuxième série
  coefficient: number         // -1 à 1 (Pearson)
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong'
  direction: 'positive' | 'negative'
  lagDays?: number            // Décalage temporel optimal
  interpretation: string
  causalityHint?: 'likely' | 'possible' | 'unlikely'
}

// Insight généré
export interface Insight {
  id: string
  type: 'trend' | 'comparison' | 'anomaly' | 'prediction' | 'recommendation'
  priority: 'info' | 'warning' | 'action' | 'critical'
  title: string
  description: string
  metrics: {
    name: string
    value: number | string
    change?: number           // Pourcentage de changement
    trend?: 'up' | 'down' | 'stable'
  }[]
  actions?: {
    label: string
    type: 'investigate' | 'adjust' | 'monitor' | 'celebrate'
  }[]
  relatedData?: string[]      // IDs des séries liées
  generatedAt: Date
  expiresAt?: Date
}

// Benchmark
export interface Benchmark {
  id: string
  metric: string
  currentValue: number
  benchmarkValue: number
  source: 'previous_period' | 'target' | 'industry' | 'best_practice'
  performance: 'exceeding' | 'meeting' | 'below' | 'critical'
  gap: number                 // Écart en valeur absolue
  gapPercent: number          // Écart en pourcentage
  trend: 'improving' | 'declining' | 'stable'
  recommendation?: string
}

// Résumé exécutif
export interface ExecutiveSummary {
  period: { start: Date; end: Date }
  highlights: string[]
  keyMetrics: {
    name: string
    value: number
    change: number
    status: 'good' | 'neutral' | 'bad'
  }[]
  topInsights: Insight[]
  risks: {
    description: string
    probability: 'low' | 'medium' | 'high'
    impact: 'low' | 'medium' | 'high'
  }[]
  opportunities: {
    description: string
    potential: number
    effort: 'low' | 'medium' | 'high'
  }[]
  recommendations: string[]
}

// Configuration d'analyse
export interface AnalysisConfig {
  anomalyThreshold: number    // Seuil de détection (écarts-types)
  predictionHorizon: number   // Jours de prédiction
  correlationMinStrength: number // Force minimale de corrélation
  insightMinConfidence: number   // Confiance minimale pour insights
  benchmarkPeriod: 'week' | 'month' | 'quarter' | 'year'
}

// Résultat d'analyse complet
export interface AnalysisResult {
  id: string
  analyzedAt: Date
  config: AnalysisConfig
  series: DataSeries[]
  anomalies: Anomaly[]
  predictions: Prediction[]
  correlations: Correlation[]
  insights: Insight[]
  benchmarks: Benchmark[]
  summary?: ExecutiveSummary
}

// Statistiques descriptives
export interface DescriptiveStats {
  count: number
  min: number
  max: number
  mean: number
  median: number
  standardDeviation: number
  variance: number
  skewness: number            // Asymétrie
  kurtosis: number            // Aplatissement
  percentiles: {
    p25: number
    p50: number
    p75: number
    p90: number
    p95: number
    p99: number
  }
}

// Tendance
export interface Trend {
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  slope: number               // Pente de la régression
  rSquared: number            // Coefficient de détermination
  changeRate: number          // Taux de changement moyen
  acceleration: number        // Changement du taux de changement
  seasonality?: {
    detected: boolean
    period: number            // Jours
    amplitude: number
  }
}

