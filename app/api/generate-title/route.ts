import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse, type AIMessage } from '@/app/lib/ai-provider'

export async function POST(request: NextRequest) {
  try {
    const { userMessage } = await request.json()

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Génère un titre court (maximum 6 mots) pour une conversation qui commence par: "${userMessage}". Réponds UNIQUEMENT avec le titre, sans guillemets ni ponctuation finale.`
      }
    ]

    const response = await generateAIResponse(messages, {
      systemPrompt: 'Tu es un assistant qui génère des titres courts et pertinents pour des conversations. Réponds UNIQUEMENT avec le titre demandé, rien d\'autre.'
    })

    return NextResponse.json({
      title: response.content.trim(),
      success: true
    })
  } catch (error) {
    console.error('Erreur API Generate Title:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du titre', success: false },
      { status: 500 }
    )
  }
}
