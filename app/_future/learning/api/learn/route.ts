/**
 * API pour enregistrer les apprentissages
 * 
 * POST /api/learn
 * Enregistre un événement d'apprentissage
 */

import { NextRequest, NextResponse } from 'next/server'

// Types d'événements acceptés
type LearnEventType = 
  | 'conversation'      // Enregistrer une conversation
  | 'feedback'          // Enregistrer un feedback
  | 'correction'        // Enregistrer une correction
  | 'preference'        // Enregistrer une préférence
  | 'pattern'           // Enregistrer un pattern détecté

interface LearnRequest {
  type: LearnEventType
  sessionId: string
  data: {
    // Pour conversation
    userMessage?: string
    aiResponse?: string
    modifications?: object
    duration?: number
    
    // Pour feedback
    messageId?: string
    feedbackType?: 'helpful' | 'not_helpful' | 'wrong' | 'too_long' | 'too_short'
    comment?: string
    
    // Pour correction
    originalInput?: string
    originalOutput?: string
    correction?: string
    
    // Pour préférence
    category?: string
    key?: string
    value?: string
    
    // Pour pattern
    patternType?: string
    sequence?: string[]
    confidence?: number
  }
  metadata?: {
    userAgent?: string
    page?: string
    timestamp?: string
  }
}

interface LearnResponse {
  success: boolean
  id?: string
  message?: string
  insights?: {
    patternsDetected?: number
    preferencesUpdated?: number
    suggestionsGenerated?: number
  }
}

// Stockage en mémoire (en production, utiliser une vraie DB)
const learningStore = {
  events: [] as any[],
  preferences: new Map<string, any>(),
  patterns: new Map<string, any>(),
  corrections: [] as any[]
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export async function POST(request: NextRequest): Promise<NextResponse<LearnResponse>> {
  try {
    const body: LearnRequest = await request.json()
    const { type, sessionId, data, metadata } = body
    
    if (!type || !sessionId) {
      return NextResponse.json(
        { success: false, message: 'Type et sessionId requis' },
        { status: 400 }
      )
    }
    
    const eventId = generateId()
    const timestamp = new Date().toISOString()
    
    switch (type) {
      case 'conversation':
        await handleConversation(eventId, sessionId, data, metadata)
        break
        
      case 'feedback':
        await handleFeedback(eventId, sessionId, data)
        break
        
      case 'correction':
        await handleCorrection(eventId, sessionId, data)
        break
        
      case 'preference':
        await handlePreference(eventId, sessionId, data)
        break
        
      case 'pattern':
        await handlePattern(eventId, sessionId, data)
        break
        
      default:
        return NextResponse.json(
          { success: false, message: `Type inconnu: ${type}` },
          { status: 400 }
        )
    }
    
    // Analyser pour insights
    const insights = await analyzeForInsights(sessionId)
    
    return NextResponse.json({
      success: true,
      id: eventId,
      insights
    })
    
  } catch (error) {
    console.error('Erreur learn API:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// === Handlers ===

async function handleConversation(
  id: string, 
  sessionId: string, 
  data: LearnRequest['data'],
  metadata?: LearnRequest['metadata']
): Promise<void> {
  const event = {
    id,
    sessionId,
    type: 'conversation',
    timestamp: new Date(),
    userMessage: data.userMessage,
    aiResponse: data.aiResponse,
    modifications: data.modifications,
    duration: data.duration,
    metadata
  }
  
  learningStore.events.push(event)
  
  // Analyser le message pour extraire des préférences
  if (data.userMessage) {
    await extractPreferencesFromMessage(sessionId, data.userMessage)
  }
  
  // Analyser les modifications pour apprendre
  if (data.modifications) {
    await learnFromModifications(sessionId, data.modifications)
  }
}

async function handleFeedback(
  id: string, 
  sessionId: string, 
  data: LearnRequest['data']
): Promise<void> {
  const feedback = {
    id,
    sessionId,
    messageId: data.messageId,
    type: data.feedbackType,
    comment: data.comment,
    timestamp: new Date()
  }
  
  learningStore.events.push({ ...feedback, eventType: 'feedback' })
  
  // Mettre à jour les métriques de qualité
  // En production, cela déclencherait une analyse plus poussée
}

async function handleCorrection(
  id: string, 
  sessionId: string, 
  data: LearnRequest['data']
): Promise<void> {
  const correction = {
    id,
    sessionId,
    originalInput: data.originalInput,
    originalOutput: data.originalOutput,
    correction: data.correction,
    timestamp: new Date(),
    applied: false
  }
  
  learningStore.corrections.push(correction)
  
  // Catégoriser la correction
  const category = categorizeCorrection(data.correction || '')
  // Note: category is used for internal processing but not stored in correction object
}

async function handlePreference(
  id: string, 
  sessionId: string, 
  data: LearnRequest['data']
): Promise<void> {
  const key = `${sessionId}:${data.key}`
  const existing = learningStore.preferences.get(key)
  
  if (existing && existing.value === data.value) {
    // Même valeur, augmenter la confiance
    existing.confidence = Math.min(1, existing.confidence + 0.1)
    existing.usageCount++
    existing.lastUsed = new Date()
  } else {
    // Nouvelle préférence ou nouvelle valeur
    learningStore.preferences.set(key, {
      id,
      sessionId,
      category: data.category,
      key: data.key,
      value: data.value,
      confidence: existing ? 0.5 : 0.3,
      usageCount: 1,
      createdAt: new Date(),
      lastUsed: new Date()
    })
  }
}

async function handlePattern(
  id: string, 
  sessionId: string, 
  data: LearnRequest['data']
): Promise<void> {
  const patternKey = data.sequence?.join('|') || id
  const existing = learningStore.patterns.get(patternKey)
  
  if (existing) {
    existing.occurrences++
    existing.confidence = Math.min(1, existing.confidence + 0.05)
    existing.lastSeen = new Date()
  } else {
    learningStore.patterns.set(patternKey, {
      id,
      sessionId,
      type: data.patternType,
      sequence: data.sequence,
      confidence: data.confidence || 0.3,
      occurrences: 1,
      firstSeen: new Date(),
      lastSeen: new Date()
    })
  }
}

// === Helpers ===

async function extractPreferencesFromMessage(
  sessionId: string, 
  message: string
): Promise<void> {
  const lower = message.toLowerCase()
  
  // Détecter les couleurs
  const colorPatterns = [
    { regex: /bleu|blue/i, color: '#3b82f6', name: 'bleu' },
    { regex: /vert|green/i, color: '#22c55e', name: 'vert' },
    { regex: /rouge|red/i, color: '#ef4444', name: 'rouge' },
    { regex: /orange/i, color: '#f97316', name: 'orange' },
    { regex: /violet|purple/i, color: '#8b5cf6', name: 'violet' }
  ]
  
  for (const { regex, color, name } of colorPatterns) {
    if (regex.test(lower)) {
      await handlePreference(generateId(), sessionId, {
        category: 'color',
        key: 'preferred_color',
        value: color
      })
      break
    }
  }
  
  // Détecter le style de réponse
  if (/court|simple|juste|direct/.test(lower)) {
    await handlePreference(generateId(), sessionId, {
      category: 'style',
      key: 'response_style',
      value: 'concise'
    })
  } else if (/explique|détail|analyse|pourquoi/.test(lower)) {
    await handlePreference(generateId(), sessionId, {
      category: 'style',
      key: 'response_style',
      value: 'detailed'
    })
  }
}

async function learnFromModifications(
  sessionId: string, 
  modifications: object
): Promise<void> {
  const mods = modifications as any
  
  if (mods.lineColor) {
    await handlePreference(generateId(), sessionId, {
      category: 'color',
      key: 'chart_color',
      value: mods.lineColor
    })
  }
  
  if (mods.showMarkers !== undefined) {
    await handlePreference(generateId(), sessionId, {
      category: 'chart',
      key: 'show_markers',
      value: String(mods.showMarkers)
    })
  }
}

function categorizeCorrection(correction: string): string {
  const lower = correction.toLowerCase()
  
  if (/non|pas ça|mauvais/.test(lower)) return 'wrong_action'
  if (/trop long|plus court/.test(lower)) return 'too_verbose'
  if (/comprends pas/.test(lower)) return 'misunderstanding'
  
  return 'other'
}

async function analyzeForInsights(sessionId: string): Promise<{
  patternsDetected: number
  preferencesUpdated: number
  suggestionsGenerated: number
}> {
  // Compter les patterns et préférences pour cette session
  const sessionPatterns = [...learningStore.patterns.values()]
    .filter(p => p.sessionId === sessionId)
  
  const sessionPreferences = [...learningStore.preferences.entries()]
    .filter(([key]) => key.startsWith(sessionId))
  
  return {
    patternsDetected: sessionPatterns.length,
    preferencesUpdated: sessionPreferences.length,
    suggestionsGenerated: Math.min(5, sessionPreferences.length + sessionPatterns.length)
  }
}

// GET pour récupérer les statistiques d'apprentissage
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  
  if (!sessionId) {
    return NextResponse.json({
      totalEvents: learningStore.events.length,
      totalPreferences: learningStore.preferences.size,
      totalPatterns: learningStore.patterns.size,
      totalCorrections: learningStore.corrections.length
    })
  }
  
  // Stats pour une session spécifique
  const sessionEvents = learningStore.events.filter(e => e.sessionId === sessionId)
  const sessionPrefs = [...learningStore.preferences.entries()]
    .filter(([key]) => key.startsWith(sessionId))
    .map(([, v]) => v)
  
  return NextResponse.json({
    sessionId,
    events: sessionEvents.length,
    preferences: sessionPrefs,
    patterns: [...learningStore.patterns.values()]
      .filter(p => p.sessionId === sessionId)
  })
}

