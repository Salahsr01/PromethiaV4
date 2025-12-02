import { NextRequest, NextResponse } from 'next/server'
import { createLearningService } from '@/app/lib/learning'

/**
 * API pour l'apprentissage IA
 * Enregistre les événements et analyse les patterns
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, type, data, metadata } = await request.json()
    
    const learningService = createLearningService(sessionId)
    
    // Enregistrer l'événement
    await learningService.logEvent(type, data, metadata)
    
    // Obtenir le contexte enrichi
    const context = await learningService.getEnrichedContext()
    
    // Obtenir les suggestions intelligentes
    const suggestions = await learningService.getSmartSuggestions()
    
    return NextResponse.json({
      success: true,
      context: {
        preferences: context.userPreferences.length,
        patterns: context.recentPatterns.length,
        mood: context.sessionHistory.currentMood
      },
      suggestions: suggestions.slice(0, 5)
    })
  } catch (error: any) {
    console.error('Erreur apprentissage:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId') || undefined
    const learningService = createLearningService(sessionId)
    
    const context = await learningService.getEnrichedContext()
    const suggestions = await learningService.getSmartSuggestions()
    
    return NextResponse.json({
      success: true,
      context,
      suggestions
    })
  } catch (error: any) {
    console.error('Erreur récupération contexte:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

