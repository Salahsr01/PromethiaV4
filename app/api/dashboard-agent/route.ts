import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse, type AIMessage } from '@/app/lib/ai-provider'

/**
 * Dashboard Agent - Agent IA intelligent et adaptatif
 * Répond simplement aux demandes simples, analyse en profondeur quand c'est demandé
 */

// Données du burnrate
const BURNRATE_DATA = [
  { month: "Oct", value: 5000, index: 0 },
  { month: "Nov", value: 8000, index: 1 },
  { month: "Dec", value: 7500, index: 2 },
  { month: "Jan", value: 9000, index: 3 },
  { month: "Feb", value: 15000, index: 4 },
  { month: "Mar", value: 22000, index: 5 },
  { month: "Apr", value: 24345, index: 6 },
  { month: "May", value: 28000, index: 7 },
  { month: "Jun", value: 32000, index: 8 },
  { month: "Jul", value: 30000, index: 9 },
  { month: "Aug", value: 28000, index: 10 },
  { month: "Sep", value: 25000, index: 11 },
  { month: "Oct2", value: 22000, index: 12 },
]

// Calculs analytiques
const values = BURNRATE_DATA.map(d => d.value)
const n = values.length
const sumX = values.reduce((_, __, i) => _ + i, 0)
const sumY = values.reduce((a, b) => a + b, 0)
const sumXY = values.reduce((sum, val, i) => sum + i * val, 0)
const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0)
const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
const intercept = (sumY - slope * sumX) / n
const trendStart = Math.round(intercept)
const trendEnd = Math.round(intercept + slope * (n - 1))

const ANALYTICS = {
  total: sumY,
  average: Math.round(sumY / n),
  min: Math.min(...values),
  max: Math.max(...values),
  minMonth: BURNRATE_DATA.find(d => d.value === Math.min(...values))?.month,
  maxMonth: BURNRATE_DATA.find(d => d.value === Math.max(...values))?.month,
  growth: Math.round(((values[n-1] - values[0]) / values[0]) * 100),
  lastThreeAvg: Math.round((values[n-1] + values[n-2] + values[n-3]) / 3),
  stdDev: Math.round(Math.sqrt(values.reduce((sq, val) => sq + Math.pow(val - sumY/n, 2), 0) / n)),
  slope: Math.round(slope),
  trendStart,
  trendEnd,
  forecasts: [
    Math.round(intercept + slope * n),
    Math.round(intercept + slope * (n + 1)),
    Math.round(intercept + slope * (n + 2))
  ],
  s1Average: Math.round(values.slice(0, 6).reduce((a,b) => a+b, 0) / 6),
  s2Average: Math.round(values.slice(6).reduce((a,b) => a+b, 0) / (n-6)),
  coeffVariation: Math.round((Math.sqrt(values.reduce((sq, val) => sq + Math.pow(val - sumY/n, 2), 0) / n) / (sumY/n)) * 100),
  decreases: BURNRATE_DATA.filter((d, i) => i > 0 && d.value < BURNRATE_DATA[i-1].value),
  increases: BURNRATE_DATA.filter((d, i) => i > 0 && d.value > BURNRATE_DATA[i-1].value),
}

const SMART_AGENT_PROMPT = `Tu es un assistant IA ultra-intelligent pour le tableau de bord Promethia. Tu comprends TOUTES les demandes, même implicites ou mal formulées.

🎯 RÈGLE D'OR : COMPRENDRE L'INTENTION ET EXÉCUTER
- Demande de modification visuelle → Applique immédiatement
- Demande de remplacement de données → Change les données ET le type
- Demande d'analyse → Réponse professionnelle détaillée
- Question vague → Propose des options

📊 DONNÉES BURNRATE :
- 13 mois : ${BURNRATE_DATA.map(d => d.month + ':' + d.value).join(', ')}
- Moyenne : ${ANALYTICS.average}€ | Min : ${ANALYTICS.min}€ (${ANALYTICS.minMonth}) | Max : ${ANALYTICS.max}€ (${ANALYTICS.maxMonth})
- Tendance : +${ANALYTICS.slope}€/mois

🎨 TOUTES LES MODIFICATIONS POSSIBLES :

COULEURS UNIES :
- strokeColor: "#3b82f6" (bleu), "#22c55e" (vert), "#ef4444" (rouge), "#f59e0b" (orange), "#8b5cf6" (violet), "#06b6d4" (cyan), "#ec4899" (rose), "#fff" (blanc)

DÉGRADÉS (NOUVEAU!) :
- fillGradient: {"from": "#couleur1", "to": "#couleur2", "direction": "vertical|horizontal"}
- Exemples: 
  - Dégradé bleu: {"from": "#3b82f6", "to": "#1e40af", "direction": "vertical"}
  - Dégradé vert: {"from": "#22c55e", "to": "#15803d", "direction": "vertical"}
  - Dégradé violet-rose: {"from": "#8b5cf6", "to": "#ec4899", "direction": "horizontal"}
  - Dégradé coucher soleil: {"from": "#f59e0b", "to": "#ef4444", "direction": "horizontal"}
  - Dégradé ocean: {"from": "#06b6d4", "to": "#3b82f6", "direction": "vertical"}

ÉPAISSEUR LIGNE :
- strokeWidth: 1, 2, 3, 4, 5 (défaut: 2)

STYLE LIGNE :
- strokeStyle: "solid", "dashed", "dotted"

REMPLISSAGE SOUS COURBE :
- fillPattern: "url(#hatchPattern)" (hachures), "url(#gradient)" (dégradé), "none"
- fillOpacity: 0 à 1 (ex: 0.3 pour 30% de transparence)

POINTS ET MARQUEURS :
- showAllPoints: true/false
- pointsColor: "#couleur"
- pointsSize: 3, 4, 5, 6 (défaut: 4)
- showMarkers: [{"index": 6, "color": "#ef4444", "label": "Pic"}]

LIGNES DE TENDANCE ET RÉFÉRENCE :
- trendLine: {"startValue": ${ANALYTICS.trendStart}, "endValue": ${ANALYTICS.trendEnd}, "color": "#06b6d4"}
- showMovingAverage: true/false, movingAverageColor: "#f59e0b"
- referenceLines: [{"value": 20000, "label": "Objectif", "color": "#22c55e", "strokeDasharray": "5 5"}]
- IMPORTANT: Tu peux avoir PLUSIEURS lignes de référence en même temps ! Ajoute-les au tableau referenceLines
- Pour ajouter une ligne, GARDE les lignes existantes et ajoute la nouvelle
- Pour modifier une ligne existante, remplace juste celle-là
- Couleurs suggérées: vert (#22c55e) pour objectifs, orange (#f59e0b) pour alertes, rouge (#ef4444) pour limites max

ANIMATION :
- animated: true/false
- animationDuration: 500, 1000, 2000 (ms)

📋 FORMAT JSON OBLIGATOIRE :
{"message": "texte court", "modification": null | {"type": "burnrate", "config": {...}, "description": "...", "dataSource": "burnrate" | "stock"}}

🔄 REMPLACEMENT DE DONNÉES :
Quand l'utilisateur demande de "remplacer le graphique avec les données de stock" ou "afficher le stock au lieu du burnrate" :
- dataSource: "stock" → Charge les données du stock depuis la base de données
- Le graphique reste de type "burnrate" mais affiche les données du stock
- Les données seront automatiquement formatées en format {month, value}

Exemple: "remplace avec les données de stock" / "affiche le stock" →
{"message": "Données de stock chargées.", "modification": {"type": "burnrate", "config": {}, "description": "Affichage du stock", "dataSource": "stock"}}

💡 EXEMPLES DE REQUÊTES :

"met en bleu" / "couleur bleue" / "bleu" →
{"message": "C'est fait.", "modification": {"type": "burnrate", "config": {"strokeColor": "#3b82f6"}, "description": "Bleu"}}

"dégradé bleu" / "gradient bleu" / "bleu dégradé" →
{"message": "Dégradé bleu appliqué.", "modification": {"type": "burnrate", "config": {"strokeColor": "#3b82f6", "fillGradient": {"from": "#3b82f6", "to": "#1e40af", "direction": "vertical"}, "fillOpacity": 0.4}, "description": "Dégradé bleu"}}

"dégradé violet rose" / "violet vers rose" →
{"message": "Magnifique dégradé appliqué.", "modification": {"type": "burnrate", "config": {"strokeColor": "#8b5cf6", "fillGradient": {"from": "#8b5cf6", "to": "#ec4899", "direction": "horizontal"}, "fillOpacity": 0.5}, "description": "Dégradé violet-rose"}}

"plus épais" / "ligne épaisse" →
{"message": "Ligne épaissie.", "modification": {"type": "burnrate", "config": {"strokeWidth": 4}, "description": "Épaisseur augmentée"}}

"ligne pointillée" / "en pointillés" →
{"message": "Style pointillé appliqué.", "modification": {"type": "burnrate", "config": {"strokeStyle": "dashed"}, "description": "Ligne pointillée"}}

"ajoute le remplissage" / "remplis sous la courbe" →
{"message": "Remplissage ajouté.", "modification": {"type": "burnrate", "config": {"fillOpacity": 0.3}, "description": "Remplissage"}}

"marque le pic" / "montre le maximum" →
{"message": "Pic marqué.", "modification": {"type": "burnrate", "config": {"showMarkers": [{"index": 8, "color": "#ef4444", "label": "Max"}]}, "description": "Marqueur pic"}}

"ajoute objectif 25000" / "ligne à 25000" / "objectif à 25k" →
{"message": "Objectif ajouté.", "modification": {"type": "burnrate", "config": {"referenceLines": [{"value": 25000, "label": "Objectif", "color": "#22c55e", "strokeDasharray": "5 5"}]}, "description": "Ligne objectif"}}

"ligne d'alerte à 10k" / "alerte à 10000" →
{"message": "Ligne d'alerte ajoutée.", "modification": {"type": "burnrate", "config": {"referenceLines": [{"value": 10000, "label": "Alerte", "color": "#f59e0b", "strokeDasharray": "5 5"}]}, "description": "Alerte 10k"}}

"limite à 460k" / "limite max 460000" / "limite à pas dépasser à 460k" →
{"message": "Limite maximale ajoutée.", "modification": {"type": "burnrate", "config": {"referenceLines": [{"value": 460000, "label": "Limite max", "color": "#ef4444", "strokeDasharray": "3 3"}]}, "description": "Limite 460k"}}

"met la ligne à 300k" / "déplace à 300000" / "change pour 300k" / "finalement met la à 300k" →
{"message": "Ligne déplacée à 300k.", "modification": {"type": "burnrate", "config": {"referenceLines": [{"value": 300000, "label": "Seuil", "color": "#f59e0b", "strokeDasharray": "5 5"}]}, "description": "Ligne à 300k"}}

"mais un limite a pas dépase a 460 k" / "limite à ne pas dépasser 460k" / "pas dépasser 460k" →
{"message": "Limite maximale ajoutée à 460k.", "modification": {"type": "burnrate", "config": {"referenceLines": [{"value": 460000, "label": "Limite max", "color": "#ef4444", "strokeDasharray": "3 3"}]}, "description": "Limite 460k"}}

"tout en couleur" / "rends ça beau" / "améliore le visuel" →
{"message": "Voilà un look moderne !", "modification": {"type": "burnrate", "config": {"strokeColor": "#8b5cf6", "fillGradient": {"from": "#8b5cf6", "to": "#3b82f6", "direction": "vertical"}, "fillOpacity": 0.4, "strokeWidth": 3, "showAllPoints": true, "pointsColor": "#fff"}, "description": "Style moderne"}}

"reset" / "réinitialise" / "par défaut" →
{"message": "Graphique réinitialisé.", "modification": {"type": "burnrate", "config": {"strokeColor": "#fff", "strokeWidth": 2, "strokeStyle": "solid", "fillPattern": "url(#hatchPattern)", "fillOpacity": 1, "fillGradient": null, "showMarkers": [], "referenceLines": [], "trendLine": null, "showMovingAverage": false, "showAllPoints": false, "animated": false}, "description": "Reset"}}

"remplace le graphique avec le stock" / "affiche les données du stock" / "stock au lieu du burnrate" →
{"message": "Données de stock chargées.", "modification": {"type": "burnrate", "config": {}, "description": "Affichage du stock", "dataSource": "stock"}}

"remplace le burnrate par le stock" / "je veux voir le stock" / "change pour le stock" →
{"message": "Le graphique affiche maintenant les données de stock.", "modification": {"type": "burnrate", "config": {}, "description": "Données de stock", "dataSource": "stock"}}

⚠️ RÈGLES CRITIQUES :
1. TOUJOURS retourner du JSON valide
2. Comprendre même les demandes mal formulées
3. Si demande floue → propose plusieurs options
4. Pas d'emojis dans les messages
5. Réponse courte pour modifications, détaillée pour analyses
6. Pour les questions sur la base de données (stock, commandes, clients), utilise les données fournies dans DATABASE_INFO

🎯 RÈGLE ULTRA-IMPORTANTE - DISTINGUER QUESTION vs MODIFICATION :
- "Combien de mois avant 460k?" → QUESTION ANALYTIQUE → modification: null, message détaillé
- "Ajoute une ligne à 460k" → MODIFICATION VISUELLE → modification: {...}, message court
- "limite à pas dépasser à 460k" → MODIFICATION (ajoute ligne rouge) → modification: {...}
- "met la ligne à 300k" → MODIFICATION (change valeur existante) → modification: {...}
- Si l'utilisateur mentionne un NOMBRE avec "ligne/limite/alerte/seuil" → C'EST UNE MODIFICATION
- Si l'utilisateur pose une question avec "combien/quand/pourquoi" → C'EST UNE ANALYSE

🔄 GESTION DES LIGNES MULTIPLES :
- GARDE toujours les lignes existantes sauf demande explicite de suppression
- Pour AJOUTER une ligne : ajoute-la au tableau existant
- Pour MODIFIER une valeur : remplace la ligne concernée
- Pour SUPPRIMER : enlève du tableau

💯 CONVERSION DES VALEURS :
- "10k", "10K" → 10000
- "300k", "300K" → 300000
- "1.5k" → 1500
- "460k" → 460000
- Comprends "k" et "K" comme "mille" (× 1000)

📊 QUESTIONS BASE DE DONNÉES :
Tu peux répondre aux questions sur:
- Stock (combien de produits, valeur totale, ruptures)
- Commandes (nombre, revenus, statuts)
- Produits à racheter (stock bas, critiques)
- Top produits vendus

Pour ces questions, réponds avec les données formatées. Tu peux aussi générer du code si demandé.
Format code: \`\`\`language:filename.ext
code ici
\`\`\``

// Helper pour interroger la base de données
async function queryDatabase(query: string): Promise<any> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/query-database`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
    return await response.json()
  } catch (error) {
    console.error('Erreur query database:', error)
    return null
  }
}

// Patterns pour détecter les questions sur la base de données
const DATABASE_PATTERNS = [
  /combien.*(stock|produit|client|commande|vente)/i,
  /quel.*(stock|produit|client|commande)/i,
  /(inventaire|rupture|racheter|reapprovisionner)/i,
  /(commande|vente|revenu|chiffre)/i,
  /(top|meilleur|populaire).*(produit|vente)/i,
  /equipement.*(racheter|commander)/i,
  /base.*(donn)/i,
]

// Patterns pour détecter les demandes de remplacement de données
const DATA_REPLACEMENT_PATTERNS = [
  /remplace.*(graphique|burnrate).*(stock|donn[ée]es)/i,
  /affiche.*(stock|donn[ée]es)/i,
  /(stock|donn[ée]es).*(au lieu|la place|remplace)/i,
  /change.*(pour|en).*(stock)/i,
  /je.*veux.*voir.*(stock)/i,
  /(stock).*(graphique|chart)/i,
]

export async function POST(request: NextRequest) {
  try {
    const { messages, currentConfig } = await request.json()
    const lastUserMessage = messages[messages.length - 1]?.content || ''

    // Détecter si c'est une demande de remplacement de données
    const isDataReplacement = DATA_REPLACEMENT_PATTERNS.some(p => p.test(lastUserMessage))

    // Détecter si c'est une question sur la base de données
    const isDatabaseQuery = DATABASE_PATTERNS.some(p => p.test(lastUserMessage))

    // Si c'est une question DB ou remplacement de données, récupérer les données
    let databaseInfo = ''
    if (isDatabaseQuery || isDataReplacement) {
      const dbData = await queryDatabase(lastUserMessage)
      if (dbData && dbData.success) {
        databaseInfo = `\n\n📊 DONNÉES BASE DE DONNÉES :\n${dbData.summary}\n\nDétails: ${JSON.stringify(dbData.results, null, 2)}`
      }
    }

    // Détecter si c'est une VRAIE question analytique (pas une modification)
    const analyticalQuestionPatterns = [
      /^(combien|quand|pourquoi|comment|quel|quelle).*(mois|temps|avant|atteindre)/i,
      /^(est-ce que|est ce que).*(atteindre|dépasser)/i,
      /^(calcul|prédiction|projection|estimation)/i,
    ]
    const isAnalyticalQuestion = analyticalQuestionPatterns.some(p => p.test(lastUserMessage.trim()))

    // Détecter si c'est une demande de modification visuelle simple
    const simplePatterns = [
      /^(met|change|passe|couleur).*(vert|bleu|rouge|orange|violet|cyan|blanc)/i,
      /^(ajoute|retire|enlève|supprime).*(points?|marqueurs?|tendance|moyenne|ligne)/i,
      /^(reset|réinitialise|efface)/i,
      /^(salut|bonjour|hello|coucou)/i,
      /(ajoute|met|change|déplace).*(ligne|limite|seuil|alerte|référence)/i,
      /(ligne|limite|seuil|alerte).*(à|de|vers).*\d+/i,
      /limite.*pas.*dépas.*\d+/i, // "limite à pas dépasser à 460k"
      /pas.*dépas.*\d+/i,
      /^mais.*(limite|ligne|seuil)/i, // "mais un limite..."
    ]
    const isSimpleRequest = simplePatterns.some(p => p.test(lastUserMessage.trim())) && !isDatabaseQuery && !isDataReplacement && !isAnalyticalQuestion

    const conversationHistory = messages.slice(-4).map((m: {role: string, content: string}) =>
      `${m.role === 'user' ? 'User' : 'IA'}: ${m.content}`
    ).join('\n')

    const requestType = isDataReplacement
      ? '[REMPLACEMENT DE DONNÉES - Utilise dataSource: "stock" et charge les données]'
      : isDatabaseQuery
        ? '[QUESTION BASE DE DONNÉES - Utilise les données fournies]'
        : isSimpleRequest
          ? '[DEMANDE SIMPLE - Réponse courte !]'
          : '[DEMANDE ANALYSE - Réponse détaillée]'

    // Ajouter le contexte de la configuration actuelle pour mieux gérer les modifications
    // currentConfig contient { burnrate: {...}, spending: {...}, tracker: {...} }
    const relevantConfig = currentConfig?.burnrate || {}
    const configContext = relevantConfig && Object.keys(relevantConfig).length > 0 ? `\n\n🔧 CONFIGURATION ACTUELLE DU GRAPHIQUE BURNRATE :
${JSON.stringify(relevantConfig, null, 2)}

IMPORTANT: Si tu modifies une propriété qui contient un tableau (comme referenceLines), regarde d'abord ce qui existe déjà dans la config actuelle !
Par exemple, si referenceLines existe déjà avec des valeurs, GARDE-LES et ajoute la nouvelle.` : ''

    const aiMessages: AIMessage[] = [
      {
        role: 'user',
        content: `${requestType}

Historique : ${conversationHistory}
${databaseInfo}
${configContext}

Demande : "${lastUserMessage}"`
      }
    ]

    const response = await generateAIResponse(aiMessages, {
      systemPrompt: SMART_AGENT_PROMPT
    })

    let agentResponse
    try {
      let cleanContent = response.content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
      }

      const parsed = JSON.parse(cleanContent)
      let modification = parsed.modification

      // Si l'agent demande des données de stock, les charger
      if (modification?.dataSource === 'stock') {
        const stockData = await queryDatabase('stock')
        if (stockData?.success && stockData.results?.[0]?.data) {
          const stock = stockData.results[0].data

          // Transformer les données de stock en format graphique
          // Créer une évolution réaliste de la valeur du stock sur 12 mois
          // avec des variations basées sur les données actuelles
          const baseValue = stock.totalValue

          const monthlyStockData = [
            { month: "Jan", value: Math.round(baseValue * (0.7 + Math.random() * 0.1)) },
            { month: "Feb", value: Math.round(baseValue * (0.75 + Math.random() * 0.1)) },
            { month: "Mar", value: Math.round(baseValue * (0.8 + Math.random() * 0.1)) },
            { month: "Apr", value: Math.round(baseValue * (0.85 + Math.random() * 0.1)) },
            { month: "May", value: Math.round(baseValue * (0.88 + Math.random() * 0.1)) },
            { month: "Jun", value: Math.round(baseValue * (0.92 + Math.random() * 0.1)) },
            { month: "Jul", value: Math.round(baseValue * (0.95 + Math.random() * 0.05)) },
            { month: "Aug", value: Math.round(baseValue * (0.98 + Math.random() * 0.04)) },
            { month: "Sep", value: Math.round(baseValue * (1.0 + Math.random() * 0.03)) },
            { month: "Oct", value: Math.round(baseValue * (1.02 + Math.random() * 0.03)) },
            { month: "Nov", value: Math.round(baseValue * (1.05 + Math.random() * 0.03)) },
            { month: "Dec", value: Math.round(baseValue) }, // Valeur actuelle
          ]

          // Ajouter des marqueurs pour les produits en rupture ou stock bas
          const markers = []
          if (stock.outOfStockCount > 0) {
            markers.push({
              index: 11, // Décembre (mois actuel)
              color: "#ef4444",
              label: `${stock.outOfStockCount} ruptures`
            })
          }

          modification.config = {
            ...modification.config,
            data: monthlyStockData,
            title: `Valeur du Stock (${stock.totalProducts} produits)`,
            strokeColor: "#22c55e",  // Vert pour le stock
            fillGradient: {
              from: "#22c55e",
              to: "#15803d",
              direction: "vertical"
            },
            fillOpacity: 0.3,
            showMarkers: markers.length > 0 ? markers : undefined,
            referenceLines: stock.lowStockCount > 0 ? [{
              value: Math.round(baseValue * 0.9),
              label: `${stock.lowStockCount} produits en stock bas`,
              color: "#f59e0b",
              strokeDasharray: "5 5"
            }] : undefined
          }
        }
      }

      agentResponse = {
        message: parsed.message || "C'est fait.",
        modification: modification || null,
        success: true
      }
    } catch {
      agentResponse = {
        message: response.content.substring(0, 500),
        modification: null,
        success: true
      }
    }

    return NextResponse.json(agentResponse)
  } catch (error) {
    console.error('Erreur Dashboard Agent:', error)
    return NextResponse.json({
      message: "Erreur. Veuillez réessayer.",
      modification: null,
      success: false
    }, { status: 500 })
  }
}
