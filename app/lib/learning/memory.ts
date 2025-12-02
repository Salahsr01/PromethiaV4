/**
 * Types pour le système de mémoire et d'apprentissage
 */

// Types d'événements traçables
export type EventType = 
  | 'message_sent'           // Utilisateur envoie un message
  | 'message_received'       // IA répond
  | 'modification_applied'   // Modification graphique appliquée
  | 'suggestion_clicked'     // Utilisateur clique sur suggestion
  | 'suggestion_ignored'     // Suggestions ignorées
  | 'correction_made'        // Utilisateur corrige/reformule
  | 'feedback_positive'      // Feedback positif explicite
  | 'feedback_negative'      // Feedback négatif explicite
  | 'widget_created'         // Widget créé
  | 'widget_deleted'         // Widget supprimé
  | 'widget_modified'        // Widget modifié
  | 'session_start'          // Début de session
  | 'session_end'            // Fin de session

// Événement de log
export interface LogEvent {
  id: string
  timestamp: Date
  sessionId: string
  userId?: string
  type: EventType
  data: {
    input?: string           // Message utilisateur
    output?: string          // Réponse IA
    intent?: string          // Intention détectée
    entities?: string[]      // Entités extraites
    modification?: object    // Modification appliquée
    duration?: number        // Durée en ms
    success?: boolean        // Succès de l'action
    context?: object         // Contexte additionnel
  }
  metadata: {
    userAgent?: string
    screenSize?: string
    page?: string
  }
}

// Préférence utilisateur apprise
export interface UserPreference {
  id: string
  userId: string
  category: 'color' | 'chart_type' | 'response_style' | 'data_category' | 'interaction'
  key: string              // Ex: "preferred_color", "chart_for_stock"
  value: string            // Ex: "#22c55e", "bar-chart"
  confidence: number       // 0-1, augmente avec les confirmations
  learnedAt: Date
  lastUsed: Date
  usageCount: number
  source: 'explicit' | 'implicit' | 'inferred'
}

// Pattern d'usage détecté
export interface UsagePattern {
  id: string
  userId?: string
  type: 'sequence' | 'timing' | 'preference' | 'correction'
  pattern: {
    trigger?: string         // Ce qui déclenche le pattern
    actions: string[]        // Séquence d'actions
    frequency: number        // Nombre d'occurrences
    context?: object         // Contexte du pattern
  }
  confidence: number
  firstSeen: Date
  lastSeen: Date
  occurrences: number
}

// Correction/Amélioration apprise
export interface LearnedCorrection {
  id: string
  originalInput: string      // Ce que l'utilisateur a dit initialement
  originalOutput: string     // Ce que l'IA a répondu
  correction: string         // La correction/reformulation
  correctOutput?: string     // La bonne réponse (si fournie)
  category: string           // Catégorie de l'erreur
  learnedAt: Date
  applied: boolean           // Si la correction a été intégrée
}

// Session utilisateur
export interface UserSession {
  id: string
  userId?: string
  startedAt: Date
  endedAt?: Date
  events: LogEvent[]
  summary?: {
    messageCount: number
    modificationsCount: number
    suggestionsClicked: number
    suggestionsIgnored: number
    corrections: number
    averageResponseTime: number
    satisfaction?: number    // Score de satisfaction estimé
  }
}

// Contexte enrichi pour les prompts
export interface EnrichedContext {
  userPreferences: UserPreference[]
  recentPatterns: UsagePattern[]
  sessionHistory: {
    messageCount: number
    lastTopics: string[]
    currentMood: 'neutral' | 'frustrated' | 'satisfied'
  }
  suggestions: {
    basedOnHistory: string[]
    basedOnTime: string[]
    basedOnContext: string[]
  }
}

// Configuration du système d'apprentissage
export interface LearningConfig {
  enabled: boolean
  persistLogs: boolean
  logRetentionDays: number
  minConfidenceThreshold: number
  learningRate: number
  maxPatternsStored: number
  anonymizeData: boolean
}

// Métriques d'apprentissage
export interface LearningMetrics {
  totalInteractions: number
  successfulResponses: number
  corrections: number
  patternsDetected: number
  preferencesLearned: number
  averageSatisfaction: number
  improvementRate: number    // % d'amélioration sur le temps
}

// Feedback pour amélioration
export interface FeedbackEntry {
  id: string
  sessionId: string
  messageId: string
  type: 'helpful' | 'not_helpful' | 'wrong' | 'too_long' | 'too_short' | 'off_topic'
  comment?: string
  timestamp: Date
}

// Suggestion améliorée basée sur l'apprentissage
export interface SmartSuggestion {
  text: string
  confidence: number
  source: 'pattern' | 'preference' | 'context' | 'trending'
  reason?: string
}

