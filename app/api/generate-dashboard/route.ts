import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request: Request) {
  try {
    const { description } = await request.json()

    if (!description) {
      return NextResponse.json({ error: 'Description requise' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Tu es un assistant qui crée des configurations de tableaux de bord professionnels.

L'utilisateur veut créer un tableau de bord avec cette description : "${description}"

Génère une réponse JSON avec:
1. "name": Un nom court et professionnel pour ce tableau de bord (max 4 mots)
2. "description": Une description claire de ce que le tableau affichera (1-2 phrases)
3. "widgets": Un tableau d'objets décrivant les widgets suggérés, chaque widget avec:
   - "type": "chart" | "kpi" | "table" | "calendar" | "progress"
   - "title": Titre du widget
   - "description": Ce qu'il affiche

Réponds UNIQUEMENT avec le JSON valide, sans markdown ni explication.`
        }
      ]
    })

    // Extraire le texte de la réponse
    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Réponse invalide de Claude')
    }

    // Parser le JSON
    const dashboardConfig = JSON.parse(textContent.text)

    return NextResponse.json({
      success: true,
      config: dashboardConfig
    })

  } catch (error) {
    console.error('Erreur génération dashboard:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du tableau de bord' },
      { status: 500 }
    )
  }
}

