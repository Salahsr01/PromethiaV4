'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * Hook pour l'apprentissage IA côté client
 * Enregistre les interactions et récupère les suggestions
 */

interface SmartSuggestion {
  text: string
  confidence: number
  source: 'preference' | 'pattern' | 'context' | 'trending'
  reason?: string
}

interface LearningContext {
  preferences: number
  patterns: number
  mood: 'satisfied' | 'neutral' | 'frustrated'
}

interface UseLearningReturn {
  // État
  suggestions: SmartSuggestion[]
  context: LearningContext | null
  isLoading: boolean
  
  // Actions
  logEvent: (type: string, data: object, metadata?: object) => Promise<void>
  logConversation: (userMessage: string, aiResponse: string, modifications?: object) => Promise<void>
  logFeedback: (type: 'helpful' | 'not_helpful' | 'wrong', messageId?: string) => Promise<void>
  refreshSuggestions: () => Promise<void>
}

export function useLearning(): UseLearningReturn {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [context, setContext] = useState<LearningContext | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const sessionIdRef = useRef<string>('')
  const initializedRef = useRef(false)
  
  // Initialiser le sessionId côté client uniquement
  useEffect(() => {
    if (!initializedRef.current) {
      sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      initializedRef.current = true
    }
  }, [])
  
  const logEvent = useCallback(async (type: string, data: object, metadata?: object) => {
    if (!sessionIdRef.current) return
    
    try {
      const response = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          type,
          data,
          metadata
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        if (result.context) {
          setContext(result.context)
        }
        if (result.suggestions) {
          setSuggestions(result.suggestions)
        }
      }
    } catch (error) {
      console.warn('Erreur log event:', error)
    }
  }, [])
  
  const logConversation = useCallback(async (
    userMessage: string, 
    aiResponse: string, 
    modifications?: object
  ) => {
    // Log du message utilisateur
    await logEvent('message_sent', { input: userMessage })
    
    // Log de la réponse IA
    await logEvent('message_received', {
      input: userMessage,
      output: aiResponse,
      modification: modifications,
      success: true
    })
    
    // Si modification appliquée
    if (modifications && Object.keys(modifications).length > 0) {
      await logEvent('modification_applied', {
        input: userMessage,
        modification: modifications
      })
    }
  }, [logEvent])
  
  const logFeedback = useCallback(async (
    type: 'helpful' | 'not_helpful' | 'wrong',
    messageId?: string
  ) => {
    await logEvent('feedback', {
      type,
      messageId,
      timestamp: new Date().toISOString()
    })
  }, [logEvent])
  
  const refreshSuggestions = useCallback(async () => {
    if (!sessionIdRef.current) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/learn?sessionId=${sessionIdRef.current}`)
      const result = await response.json()
      
      if (result.success) {
        if (result.context) {
          setContext({
            preferences: result.context.userPreferences?.length || 0,
            patterns: result.context.recentPatterns?.length || 0,
            mood: result.context.sessionHistory?.currentMood || 'neutral'
          })
        }
        if (result.suggestions) {
          setSuggestions(result.suggestions)
        }
      }
    } catch (error) {
      console.warn('Erreur refresh suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  return {
    suggestions,
    context,
    isLoading,
    logEvent,
    logConversation,
    logFeedback,
    refreshSuggestions
  }
}

export default useLearning
