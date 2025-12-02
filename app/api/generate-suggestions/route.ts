import { NextRequest, NextResponse } from 'next/server'
import { generateJSON, type AIMessage } from '@/app/lib/ai-provider'

interface SuggestionsResponse {
  best: string
  others: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const aiMessages: AIMessage[] = [
      {
        role: 'user',
        content: `Voici l'historique de la conversation:\n${JSON.stringify(messages)}\n\nGénère 3 suggestions de questions que l'UTILISATEUR peut poser à l'IA pour continuer la conversation. Les suggestions doivent être des questions que l'utilisateur pose, pas des questions que l'IA pose à l'utilisateur.\n\nRéponds UNIQUEMENT avec un JSON: {"best": "question principale", "others": ["question 2", "question 3"]}`
      }
    ]

    const suggestions = await generateJSON<SuggestionsResponse>(aiMessages, {
      systemPrompt: `Tu analyses des conversations et suggères des questions de suivi pertinentes que l'UTILISATEUR peut poser à l'IA.

IMPORTANT : Les suggestions doivent être formulées comme des questions que l'UTILISATEUR pose à l'IA, PAS comme des questions que l'IA pose à l'utilisateur.

✅ BONNES suggestions (questions de l'utilisateur vers l'IA) :
- "Peux-tu me donner plus de détails ?"
- "Comment puis-je faire cela ?"
- "Quelle est la prochaine étape ?"
- "Peux-tu expliquer cela différemment ?"
- "Quels sont les avantages ?"

❌ MAUVAISES suggestions (questions de l'IA vers l'utilisateur) :
- "Comment puis-je vous aider ?"
- "Qu'aimeriez-vous savoir ?"
- "Avez-vous d'autres questions ?"
- "Que souhaitez-vous faire ensuite ?"

La première question (best) doit être la plus utile et pertinente.
Maximum 60 caractères par suggestion.
Réponds UNIQUEMENT avec un JSON valide: {"best": "...", "others": ["...", "..."]}`
    })

    return NextResponse.json({
      bestSuggestion: suggestions.best,
      suggestions: suggestions.others,
      success: true
    })
  } catch (error) {
    console.error('Erreur API Generate Suggestions:', error)
    // Fallback suggestions
    return NextResponse.json({
      bestSuggestion: "Peux-tu me donner plus de détails ?",
      suggestions: ["Quelle est la prochaine étape ?", "Comment puis-je utiliser cette information ?"],
      success: true
    })
  }
}
