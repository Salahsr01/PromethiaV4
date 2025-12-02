import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse, type AIMessage } from '@/app/lib/ai-provider'

const SMART_SUGGESTIONS_PROMPT = `Tu génères des suggestions intelligentes pour un assistant d'analyse financière.

L'assistant peut :
- Analyser les données et expliquer les tendances
- Faire des calculs (moyennes, variations, prévisions)
- Répondre aux questions business
- Modifier les graphiques (couleurs, marqueurs, lignes)

Données disponibles : Burnrate mensuel sur 13 mois (5k€ à 32k€)
Analyses : moyenne 19k€, croissance +340%, 5 mois de baisse, 7 mois de hausse

Génère 3 suggestions VARIÉES et INTELLIGENTES basées sur la conversation :
- Mélange questions d'analyse ET modifications visuelles
- Propose des insights business
- Sois créatif

RÉPONDS UNIQUEMENT avec un JSON valide :
{"best": "suggestion principale", "others": ["suggestion 2", "suggestion 3"]}

Suggestions max 45 caractères, en français.

Exemples de bonnes suggestions variées :
- "Quelle est la tendance générale ?"
- "Pourquoi cette baisse en juillet ?"
- "Compare les 6 premiers mois aux 6 derniers"
- "Ajoute la moyenne sur le graphique"
- "Montre les mois au-dessus de 25k€"
- "Quelle prévision pour le mois prochain ?"
- "Met les hausses en vert"
- "Quel est le mois le plus rentable ?"`

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const lastMessages = messages.slice(-4)
    const context = `Conversation: ${JSON.stringify(lastMessages)}

Génère 3 suggestions intelligentes et variées pour continuer.`

    const aiMessages: AIMessage[] = [
      { role: 'user', content: context }
    ]

    const response = await generateAIResponse(aiMessages, {
      systemPrompt: SMART_SUGGESTIONS_PROMPT
    })

    // Parser le JSON
    let parsed
    try {
      let cleanContent = response.content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
      }
      parsed = JSON.parse(cleanContent)
    } catch {
      // Fallback suggestions intelligentes
      parsed = {
        best: "Analyse la tendance générale",
        others: ["Pourquoi ces baisses ?", "Ajoute la moyenne"]
      }
    }

    return NextResponse.json({
      bestSuggestion: parsed.best,
      suggestions: parsed.others || [],
      success: true
    })
  } catch (error) {
    console.error('Erreur Dashboard Suggestions:', error)
    return NextResponse.json({
      bestSuggestion: "Explique les variations",
      suggestions: ["Quelle est la moyenne ?", "Montre les hausses"],
      success: true
    })
  }
}
