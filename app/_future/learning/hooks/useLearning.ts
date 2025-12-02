/**
 * Hook React pour l'intégration du système d'apprentissage
 * 
 * Fournit une interface simple pour utiliser les fonctionnalités
 * d'apprentissage dans les composants React.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  EnrichedContext, 
  SmartSuggestion, 
  EventType,
  LearningMetrics,
  LogEvent
} from '../types/memory'
import { createLearningService, LearningService } from '../services/LearningService'
import { createPatternDetector, PatternDetector } from '../services/PatternDetector'
import { createFeedbackLoop, FeedbackLoop } from '../services/FeedbackLoop'

// Génération d'ID de session
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

interface UseLearningOptions {
  autoTrack?: boolean           // Activer le tracking automatique
  sessionId?: string            // ID de session personnalisé
  enablePatternDetection?: boolean
  enableFeedbackLoop?: boolean
}

interface UseLearningReturn {
  // État
  isInitialized: boolean
  sessionId: string
  metrics: LearningMetrics | null
  context: EnrichedContext | null
  suggestions: SmartSuggestion[]
  
  // Actions de logging
  logMessage: (userMessage: string, aiResponse: string, modifications?: object) => Promise<void>
  logEvent: (type: EventType, data?: object) => Promise<void>
  logSuggestionClick: (suggestion: string) => Promise<void>
  logCorrection: (correction: string) => Promise<void>
  
  // Feedback
  sendFeedback: (messageId: string, type: 'helpful' | 'not_helpful' | 'wrong') => Promise<void>
  
  // Contexte enrichi
  refreshContext: () => Promise<void>
  getEnrichedPrompt: (basePrompt: string) => Promise<string>
  
  // Suggestions intelligentes
  refreshSuggestions: (currentContext?: object) => Promise<void>
  
  // Patterns
  detectPatterns: () => Promise<void>
  getPredictions: (currentAction: string) => Promise<string[]>
  
  // Qualité
  getHealthScore: () => Promise<{ score: number; status: string }>
  
  // Export
  exportData: () => Promise<object>
}

export function useLearning(options: UseLearningOptions = {}): UseLearningReturn {
  const {
    autoTrack = true,
    sessionId: customSessionId,
    enablePatternDetection = true,
    enableFeedbackLoop = true
  } = options
  
  // Services
  const learningService = useRef<LearningService | null>(null)
  const patternDetector = useRef<PatternDetector | null>(null)
  const feedbackLoop = useRef<FeedbackLoop | null>(null)
  
  // État
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null)
  const [context, setContext] = useState<EnrichedContext | null>(null)
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  
  // Initialisation
  useEffect(() => {
    const sid = customSessionId || generateSessionId()
    setSessionId(sid)
    
    learningService.current = createLearningService(sid)
    
    if (enablePatternDetection) {
      patternDetector.current = createPatternDetector()
    }
    
    if (enableFeedbackLoop) {
      feedbackLoop.current = createFeedbackLoop()
    }
    
    // Log du début de session
    if (autoTrack) {
      learningService.current.logEvent('session_start', {})
    }
    
    setIsInitialized(true)
    
    // Cleanup
    return () => {
      if (autoTrack && learningService.current) {
        learningService.current.logEvent('session_end', {})
      }
    }
  }, [customSessionId, autoTrack, enablePatternDetection, enableFeedbackLoop])
  
  // Charger le contexte initial
  useEffect(() => {
    if (isInitialized && learningService.current) {
      refreshContext()
      refreshSuggestions()
    }
  }, [isInitialized])
  
  // === ACTIONS DE LOGGING ===
  
  const logMessage = useCallback(async (
    userMessage: string, 
    aiResponse: string, 
    modifications?: object
  ) => {
    if (!learningService.current) return
    
    const startTime = Date.now()
    await learningService.current.logConversation(
      userMessage,
      aiResponse,
      modifications,
      Date.now() - startTime
    )
    
    // Rafraîchir les suggestions après chaque message
    await refreshSuggestions()
  }, [])
  
  const logEvent = useCallback(async (type: EventType, data: object = {}) => {
    if (!learningService.current) return
    await learningService.current.logEvent(type, data)
  }, [])
  
  const logSuggestionClick = useCallback(async (suggestion: string) => {
    if (!learningService.current) return
    await learningService.current.logEvent('suggestion_clicked', { input: suggestion })
  }, [])
  
  const logCorrection = useCallback(async (correction: string) => {
    if (!learningService.current) return
    await learningService.current.logEvent('correction_made', { input: correction })
  }, [])
  
  // === FEEDBACK ===
  
  const sendFeedback = useCallback(async (
    messageId: string, 
    type: 'helpful' | 'not_helpful' | 'wrong'
  ) => {
    if (!learningService.current) return
    await learningService.current.recordFeedback(messageId, type)
  }, [])
  
  // === CONTEXTE ===
  
  const refreshContext = useCallback(async () => {
    if (!learningService.current) return
    
    const enrichedContext = await learningService.current.getEnrichedContext()
    setContext(enrichedContext)
  }, [])
  
  const getEnrichedPrompt = useCallback(async (basePrompt: string): Promise<string> => {
    if (!learningService.current) return basePrompt
    return learningService.current.enrichPrompt(basePrompt)
  }, [])
  
  // === SUGGESTIONS ===
  
  const refreshSuggestions = useCallback(async (currentContext?: object) => {
    if (!learningService.current) return
    
    const smartSuggestions = await learningService.current.getSmartSuggestions(currentContext)
    setSuggestions(smartSuggestions)
  }, [])
  
  // === PATTERNS ===
  
  const detectPatterns = useCallback(async () => {
    if (!patternDetector.current || !learningService.current) return
    
    const data = await learningService.current.exportLearningData() as { logs?: LogEvent[] }
    if (data.logs) {
      await patternDetector.current.detectPatterns(data.logs)
    }
  }, [])
  
  const getPredictions = useCallback(async (currentAction: string): Promise<string[]> => {
    if (!patternDetector.current) return []
    return patternDetector.current.predictNextActions(currentAction)
  }, [])
  
  // === QUALITÉ ===
  
  const getHealthScore = useCallback(async (): Promise<{ score: number; status: string }> => {
    if (!feedbackLoop.current) return { score: 0, status: 'unknown' }
    
    const health = await feedbackLoop.current.calculateHealthScore()
    return { score: health.score, status: health.status }
  }, [])
  
  // === EXPORT ===
  
  const exportData = useCallback(async (): Promise<object> => {
    if (!learningService.current) return {}
    return learningService.current.exportLearningData()
  }, [])
  
  return {
    isInitialized,
    sessionId,
    metrics,
    context,
    suggestions,
    logMessage,
    logEvent,
    logSuggestionClick,
    logCorrection,
    sendFeedback,
    refreshContext,
    getEnrichedPrompt,
    refreshSuggestions,
    detectPatterns,
    getPredictions,
    getHealthScore,
    exportData
  }
}

export default useLearning

