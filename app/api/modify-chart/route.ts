import { NextRequest, NextResponse } from 'next/server'
import { generateJSON, type AIMessage } from '@/app/lib/ai-provider'

interface ChartModification {
  type: 'burnrate' | 'spending' | 'tracker'
  config: Record<string, unknown>
}

const CHART_SYSTEM_PROMPT = `Tu es un expert en visualisation de données. Tu analyses les demandes utilisateur et génères des configurations JSON pour modifier des graphiques.

INTERFACES DISPONIBLES:

interface BurnrateConfig {
  data: Array<{ month: string; value: number }>
  strokeColor: string          // Hex color ex: "#22c55e"
  fillPattern: string          // ex: "url(#hatchPattern)"
  showMarkers?: Array<{ index: number; color: string; label: string }>
  referenceLines?: Array<{ value: number; label: string; color: string; strokeDasharray?: string }>
  title: string
}

interface SpendingConfig {
  data: Array<{ name: string; percentage: number; color: string }>
  filterThreshold?: number
  title: string
}

interface TrackerConfig {
  trackedDays: number[]
  markerColor: string          // Tailwind class ex: "bg-blue-400"
  title: string
}

CAPACITÉS:
- Calculer des statistiques (min, max, moyenne, variations en %)
- Ajouter des marqueurs avec labels
- Créer des lignes de référence
- Identifier des patterns (hausses, baisses)
- Modifier couleurs et titres

RÈGLES:
- Réponds UNIQUEMENT avec un JSON: {"type": "burnrate"|"spending"|"tracker", "config": {...}}
- Couleurs hex pour burnrate/spending, Tailwind pour tracker
- Sois intelligent et créatif dans l'analyse`

const BURNRATE_DATA = [
  { month: "Oct", value: 5000 },
  { month: "Nov", value: 8000 },
  { month: "Dec", value: 7500 },
  { month: "Jan", value: 9000 },
  { month: "Feb", value: 15000 },
  { month: "Mar", value: 22000 },
  { month: "Apr", value: 24345 },
  { month: "May", value: 28000 },
  { month: "Jun", value: 32000 },
  { month: "Jul", value: 30000 },
  { month: "Aug", value: 28000 },
  { month: "Sep", value: 25000 },
  { month: "Oct2", value: 22000 }
]

export async function POST(request: NextRequest) {
  try {
    const { userMessage, conversationHistory } = await request.json()

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `DEMANDE: "${userMessage}"

DONNÉES BURNRATE:
${JSON.stringify(BURNRATE_DATA, null, 2)}

HISTORIQUE:
${JSON.stringify(conversationHistory?.slice(-4) || [])}

Analyse la demande et génère la configuration JSON appropriée.`
      }
    ]

    const modification = await generateJSON<ChartModification>(messages, {
      systemPrompt: CHART_SYSTEM_PROMPT
    })

    return NextResponse.json({
      success: true,
      modification,
      aiMessage: `J'ai modifié le graphique ${modification.type} selon votre demande.`
    })
  } catch (error) {
    console.error('Erreur dans /api/modify-chart:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement de la demande' },
      { status: 500 }
    )
  }
}
