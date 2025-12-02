/**
 * API pour récupérer les connaissances apprises
 * 
 * GET /api/recall
 * Récupère le contexte enrichi, les suggestions et les préférences
 */

import { NextRequest, NextResponse } from 'next/server'

// Types de rappel
type RecallType = 
  | 'context'       // Contexte enrichi complet
  | 'preferences'   // Préférences utilisateur
  | 'suggestions'   // Suggestions intelligentes
  | 'patterns'      // Patterns détectés
  | 'prompt'        // Prompt enrichi
  | 'health'        // Score de santé du système

interface RecallResponse {
  success: boolean
  type: RecallType
  data: any
  timestamp: string
}

// Stockage simulé (en production, même store que learn)
const learningStore = {
  preferences: new Map<string, any>(),
  patterns: new Map<string, any>(),
  events: [] as any[]
}

export async function GET(request: NextRequest): Promise<NextResponse<RecallResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'context') as RecallType
    const sessionId = searchParams.get('sessionId') || 'default'
    
    let data: any
    
    switch (type) {
      case 'context':
        data = await getEnrichedContext(sessionId)
        break
        
      case 'preferences':
        data = await getPreferences(sessionId)
        break
        
      case 'suggestions':
        data = await getSmartSuggestions(sessionId)
        break
        
      case 'patterns':
        data = await getPatterns(sessionId)
        break
        
      case 'prompt':
        const basePrompt = searchParams.get('basePrompt') || ''
        data = await getEnrichedPrompt(sessionId, basePrompt)
        break
        
      case 'health':
        data = await getHealthScore()
        break
        
      default:
        return NextResponse.json({
          success: false,
          type,
          data: null,
          timestamp: new Date().toISOString()
        }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      type,
      data,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Erreur recall API:', error)
    return NextResponse.json({
      success: false,
      type: 'context',
      data: null,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// === Helpers ===

async function getEnrichedContext(sessionId: string): Promise<object> {
  const preferences = await getPreferences(sessionId)
  const patterns = await getPatterns(sessionId)
  const suggestions = await getSmartSuggestions(sessionId)
  
  // Analyser l'humeur basée sur les corrections récentes
  const recentEvents = learningStore.events
    .filter(e => e.sessionId === sessionId)
    .slice(-20)
  
  const corrections = recentEvents.filter(e => e.type === 'correction').length
  const mood = corrections > 3 ? 'frustrated' : 
               corrections === 0 ? 'satisfied' : 'neutral'
  
  return {
    userPreferences: preferences,
    recentPatterns: patterns.slice(0, 10),
    sessionHistory: {
      messageCount: recentEvents.filter(e => e.type === 'conversation').length,
      lastTopics: extractTopics(recentEvents),
      currentMood: mood
    },
    suggestions: {
      smart: suggestions,
      basedOnTime: getTimeBasedSuggestions(),
      basedOnContext: getContextualSuggestions(preferences)
    }
  }
}

async function getPreferences(sessionId: string): Promise<any[]> {
  const prefs: any[] = []
  
  for (const [key, value] of learningStore.preferences) {
    if (key.startsWith(sessionId) || key.startsWith('default')) {
      prefs.push(value)
    }
  }
  
  // Trier par confiance
  return prefs.sort((a, b) => b.confidence - a.confidence)
}

async function getSmartSuggestions(sessionId: string): Promise<any[]> {
  const preferences = await getPreferences(sessionId)
  const patterns = await getPatterns(sessionId)
  
  const suggestions: any[] = []
  
  // Suggestions basées sur les préférences
  const colorPref = preferences.find(p => p.key === 'preferred_color')
  if (colorPref && colorPref.confidence > 0.6) {
    suggestions.push({
      text: 'Utiliser ma couleur préférée',
      confidence: colorPref.confidence,
      source: 'preference',
      reason: 'Basé sur vos choix précédents'
    })
  }
  
  // Suggestions basées sur les patterns
  for (const pattern of patterns.slice(0, 3)) {
    if (pattern.sequence && pattern.sequence[0]) {
      suggestions.push({
        text: denormalizeAction(pattern.sequence[0]),
        confidence: pattern.confidence,
        source: 'pattern',
        reason: `Utilisé ${pattern.occurrences} fois`
      })
    }
  }
  
  // Suggestions contextuelles par défaut
  const defaultSuggestions = [
    { text: 'Changer la couleur', confidence: 0.5, source: 'default' },
    { text: 'Ajouter une tendance', confidence: 0.4, source: 'default' },
    { text: 'Analyser les données', confidence: 0.4, source: 'default' }
  ]
  
  // Compléter avec les suggestions par défaut si nécessaire
  while (suggestions.length < 5) {
    const next = defaultSuggestions.shift()
    if (!next) break
    if (!suggestions.find(s => s.text === next.text)) {
      suggestions.push(next)
    }
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
}

async function getPatterns(sessionId: string): Promise<any[]> {
  const patterns: any[] = []
  
  for (const pattern of learningStore.patterns.values()) {
    if (pattern.sessionId === sessionId || !pattern.sessionId) {
      patterns.push(pattern)
    }
  }
  
  return patterns.sort((a, b) => b.confidence - a.confidence)
}

async function getEnrichedPrompt(sessionId: string, basePrompt: string): Promise<string> {
  const preferences = await getPreferences(sessionId)
  const additions: string[] = []
  
  // Ajouter les préférences de haute confiance
  const highConfidence = preferences.filter(p => p.confidence > 0.7)
  if (highConfidence.length > 0) {
    additions.push('\n\n## Préférences utilisateur connues:')
    for (const pref of highConfidence) {
      additions.push(`- ${pref.key}: ${pref.value}`)
    }
  }
  
  // Ajouter le style de réponse
  const stylePref = preferences.find(p => p.key === 'response_style')
  if (stylePref) {
    if (stylePref.value === 'concise') {
      additions.push('\n\n## Style: Réponses COURTES et DIRECTES.')
    } else if (stylePref.value === 'detailed') {
      additions.push('\n\n## Style: Réponses DÉTAILLÉES avec explications.')
    }
  }
  
  // Ajouter les avertissements basés sur les patterns de correction
  const recentEvents = learningStore.events
    .filter(e => e.sessionId === sessionId)
    .slice(-10)
  
  const corrections = recentEvents.filter(e => e.type === 'correction').length
  if (corrections > 2) {
    additions.push('\n\n## ⚠️ ATTENTION: L\'utilisateur a dû corriger plusieurs fois. Sois EXTRA clair et direct.')
  }
  
  return basePrompt + additions.join('\n')
}

async function getHealthScore(): Promise<object> {
  const totalEvents = learningStore.events.length
  const corrections = learningStore.events.filter(e => e.type === 'correction').length
  const successRate = totalEvents > 0 ? (totalEvents - corrections) / totalEvents : 1
  
  const score = Math.round(successRate * 100)
  const status = score >= 85 ? 'excellent' :
                 score >= 70 ? 'good' :
                 score >= 50 ? 'fair' : 'poor'
  
  return {
    score,
    status,
    factors: [
      { name: 'Taux de succès', value: successRate },
      { name: 'Préférences apprises', value: learningStore.preferences.size },
      { name: 'Patterns détectés', value: learningStore.patterns.size }
    ]
  }
}

// === Utilitaires ===

function extractTopics(events: any[]): string[] {
  const topics = new Set<string>()
  
  for (const event of events) {
    if (event.userMessage) {
      const lower = event.userMessage.toLowerCase()
      if (lower.includes('couleur')) topics.add('couleur')
      if (lower.includes('point')) topics.add('marqueurs')
      if (lower.includes('tendance')) topics.add('tendance')
      if (lower.includes('analyse')) topics.add('analyse')
    }
  }
  
  return [...topics].slice(0, 5)
}

function getTimeBasedSuggestions(): string[] {
  const hour = new Date().getHours()
  
  if (hour >= 8 && hour < 12) {
    return ['Résumé du matin', 'Objectifs du jour']
  } else if (hour >= 17 && hour < 20) {
    return ['Bilan de la journée']
  }
  
  return []
}

function getContextualSuggestions(preferences: any[]): string[] {
  const suggestions: string[] = []
  
  const colorPref = preferences.find(p => p.key === 'chart_color')
  if (colorPref) {
    suggestions.push('Appliquer cette couleur partout')
  }
  
  return suggestions
}

function denormalizeAction(action: string): string {
  const mapping: Record<string, string> = {
    'change_color': 'Changer la couleur',
    'toggle_markers': 'Afficher les points',
    'toggle_trend': 'Afficher la tendance',
    'request_analysis': 'Analyser les données',
    'add_threshold': 'Ajouter un seuil',
    'reset': 'Réinitialiser'
  }
  
  return mapping[action] || action
}

