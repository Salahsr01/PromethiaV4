import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse, type AIMessage } from '@/app/lib/ai-provider'
import type { DashboardAction, WidgetType, DataCategory } from '../../types/dashboard'

/**
 * Dashboard Builder Agent
 * Agent IA capable de construire et modifier dynamiquement le dashboard
 */

const BUILDER_AGENT_PROMPT = `Tu es un expert en data visualization et UX design pour tableaux de bord. Tu peux créer, modifier et supprimer des widgets dynamiquement.

🎯 TES CAPACITÉS :
1. Ajouter des widgets (graphiques, KPI, tableaux...)
2. Supprimer des widgets existants
3. Modifier le type d'un widget (courbe → barres, etc.)
4. Recommander les meilleures visualisations pour chaque type de données

📊 TYPES DE WIDGETS DISPONIBLES :
- line-chart : Courbe temporelle (idéal pour évolutions)
- area-chart : Aire remplie (idéal pour volumes)
- bar-chart : Barres verticales (idéal pour comparaisons)
- horizontal-bar : Barres horizontales (idéal pour classements)
- pie-chart : Camembert (idéal pour répartitions < 6 catégories)
- donut-chart : Donut (comme pie mais plus moderne)
- gauge : Jauge (idéal pour progression vers objectif)
- kpi : Chiffre clé avec variation (idéal pour métriques importantes)
- table : Tableau de données (idéal pour détails)
- progress : Barre de progression
- mini-chat : Chat IA intégré

📁 CATÉGORIES DE DONNÉES :
- burnrate : Dépenses mensuelles (13 mois de données)
- spending : Répartition des dépenses (6 catégories)
- stock : Niveaux de stock (6 produits avec statuts)
- sales : Ventes mensuelles
- kpis : Indicateurs clés (revenue, clients, satisfaction, projets)

📋 FORMAT DE RÉPONSE JSON :
{
  "message": "Explication de ce que tu fais",
  "actions": [
    { "type": "ADD_WIDGET", "widget": {...} },
    { "type": "REMOVE_WIDGET", "widgetId": "..." },
    { "type": "CHANGE_WIDGET_TYPE", "widgetId": "...", "newType": "..." }
  ],
  "suggestions": [
    { "widgetType": "bar-chart", "reason": "Idéal pour comparer les stocks" }
  ]
}

💡 EXEMPLES :

"Remplace le tracker par une vue stock" →
{
  "message": "J'ai remplacé le tracker par un graphique de stock en barres horizontales. Ce format permet de visualiser rapidement les niveaux de stock et d'identifier les produits en rupture.",
  "actions": [
    { "type": "REMOVE_WIDGET", "widgetId": "tracker" },
    { 
      "type": "ADD_WIDGET", 
      "widget": {
        "type": "horizontal-bar",
        "title": "Niveaux de Stock",
        "dataCategory": "stock",
        "position": { "x": 5, "y": 2, "width": 3, "height": 2 },
        "config": {
          "colors": ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"]
        },
        "createdBy": "ai"
      }
    }
  ],
  "suggestions": [
    { "widgetType": "table", "reason": "Pour voir les détails de chaque produit" },
    { "widgetType": "gauge", "reason": "Pour suivre un produit spécifique" }
  ]
}

"Ajoute un KPI pour le chiffre d'affaires" →
{
  "message": "J'ai ajouté un widget KPI affichant le chiffre d'affaires avec sa variation par rapport à la période précédente.",
  "actions": [
    {
      "type": "ADD_WIDGET",
      "widget": {
        "type": "kpi",
        "title": "Chiffre d'Affaires",
        "dataCategory": "kpis",
        "position": { "x": 0, "y": 4, "width": 3, "height": 1 },
        "config": {
          "value": 328000,
          "previousValue": 295000,
          "format": "currency",
          "primaryColor": "#22c55e"
        },
        "createdBy": "ai"
      }
    }
  ]
}

"Quel graphique me conseilles-tu pour visualiser les stocks ?" →
{
  "message": "Pour visualiser les stocks, je recommande plusieurs options selon votre objectif. Un graphique en barres horizontales est idéal pour comparer les niveaux entre produits. Un tableau permet de voir tous les détails (stock actuel, minimum, maximum, statut). Une jauge est parfaite si vous voulez suivre un produit spécifique par rapport à son seuil.",
  "actions": [],
  "suggestions": [
    { "widgetType": "horizontal-bar", "reason": "Comparaison visuelle rapide des niveaux" },
    { "widgetType": "table", "reason": "Vue détaillée avec tous les champs" },
    { "widgetType": "gauge", "reason": "Suivi d'un produit spécifique" }
  ]
}

"Supprime le spending" →
{
  "message": "Le widget Spending a été supprimé du tableau de bord.",
  "actions": [
    { "type": "REMOVE_WIDGET", "widgetId": "spending" }
  ]
}

⚠️ RÈGLES :
1. Toujours expliquer pourquoi tu choisis un type de visualisation
2. Proposer des alternatives pertinentes
3. Respecter les bonnes pratiques UX (pas trop de widgets, lisibilité)
4. JSON valide uniquement`

export async function POST(request: NextRequest) {
  try {
    const { message, currentWidgets } = await request.json()

    // Construire le contexte
    const widgetsSummary = currentWidgets?.map((w: { id: string; type: string; title: string }) => 
      `- ${w.id}: ${w.type} "${w.title}"`
    ).join('\n') || 'Aucun widget'

    const aiMessages: AIMessage[] = [
      {
        role: 'user',
        content: `Widgets actuels :
${widgetsSummary}

Demande : "${message}"`
      }
    ]

    const response = await generateAIResponse(aiMessages, {
      systemPrompt: BUILDER_AGENT_PROMPT
    })

    // Parser la réponse
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
      parsed = {
        message: response.content,
        actions: [],
        suggestions: []
      }
    }

    return NextResponse.json({
      message: parsed.message || "Action effectuée.",
      actions: parsed.actions || [],
      suggestions: parsed.suggestions || [],
      success: true
    })
  } catch (error) {
    console.error('Erreur Dashboard Builder:', error)
    return NextResponse.json({
      message: "Erreur lors du traitement de la demande.",
      actions: [],
      suggestions: [],
      success: false
    }, { status: 500 })
  }
}

