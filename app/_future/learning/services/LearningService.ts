/**
 * Service principal d'apprentissage
 * 
 * Orchestre l'apprentissage de l'IA à partir des interactions utilisateur.
 * Analyse les patterns, détecte les préférences, et améliore les réponses.
 */

import { 
  LogEvent, 
  UserPreference, 
  UsagePattern, 
  LearnedCorrection,
  EnrichedContext,
  SmartSuggestion,
  EventType
} from '../types/memory'
import { getMemoryStore } from '../stores/MemoryStore'

// Génération d'ID unique
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export class LearningService {
  private sessionId: string
  private store = getMemoryStore()
  
  constructor(sessionId?: string) {
    this.sessionId = sessionId || generateId()
  }
  
  // ===== LOGGING =====
  
  /**
   * Enregistre un événement d'interaction
   */
  async logEvent(
    type: EventType,
    data: LogEvent['data'],
    metadata?: LogEvent['metadata']
  ): Promise<void> {
    const event: LogEvent = {
      id: generateId(),
      timestamp: new Date(),
      sessionId: this.sessionId,
      type,
      data,
      metadata: metadata || {}
    }
    
    await this.store.addLog(event)
    
    // Analyser l'événement pour apprentissage
    await this.analyzeEvent(event)
  }
  
  /**
   * Enregistre un message utilisateur et la réponse IA
   */
  async logConversation(
    userMessage: string,
    aiResponse: string,
    modifications?: object,
    duration?: number
  ): Promise<void> {
    // Log du message utilisateur
    await this.logEvent('message_sent', { input: userMessage })
    
    // Log de la réponse IA
    await this.logEvent('message_received', {
      input: userMessage,
      output: aiResponse,
      modification: modifications,
      duration,
      success: true
    })
    
    // Si modification appliquée
    if (modifications && Object.keys(modifications).length > 0) {
      await this.logEvent('modification_applied', {
        input: userMessage,
        modification: modifications
      })
    }
  }
  
  // ===== ANALYSE ET APPRENTISSAGE =====
  
  /**
   * Analyse un événement pour en extraire des apprentissages
   */
  private async analyzeEvent(event: LogEvent): Promise<void> {
    switch (event.type) {
      case 'message_sent':
        await this.analyzeUserIntent(event)
        break
      case 'modification_applied':
        await this.learnFromModification(event)
        break
      case 'correction_made':
        await this.learnFromCorrection(event)
        break
      case 'suggestion_clicked':
        await this.reinforceSuggestion(event)
        break
    }
  }
  
  /**
   * Analyse l'intention de l'utilisateur
   */
  private async analyzeUserIntent(event: LogEvent): Promise<void> {
    const input = event.data.input?.toLowerCase() || ''
    
    // Détecter les patterns de couleur
    const colorPatterns = [
      { regex: /(?:en |couleur |color )?(bleu|blue)/i, color: '#3b82f6' },
      { regex: /(?:en |couleur |color )?(vert|green)/i, color: '#22c55e' },
      { regex: /(?:en |couleur |color )?(rouge|red)/i, color: '#ef4444' },
      { regex: /(?:en |couleur |color )?(orange)/i, color: '#f97316' },
      { regex: /(?:en |couleur |color )?(violet|purple)/i, color: '#8b5cf6' },
      { regex: /(?:en |couleur |color )?(rose|pink)/i, color: '#ec4899' },
      { regex: /(?:en |couleur |color )?(jaune|yellow)/i, color: '#eab308' },
      { regex: /(?:en |couleur |color )?(cyan)/i, color: '#06b6d4' },
    ]
    
    for (const { regex, color } of colorPatterns) {
      if (regex.test(input)) {
        await this.updateColorPreference(color)
        break
      }
    }
    
    // Détecter le style de réponse souhaité
    if (input.includes('court') || input.includes('simple') || input.includes('juste')) {
      await this.updatePreference('response_style', 'short', 'concise')
    } else if (input.includes('explique') || input.includes('détail') || input.includes('analyse')) {
      await this.updatePreference('response_style', 'detailed', 'analytical')
    }
  }
  
  /**
   * Apprend d'une modification réussie
   */
  private async learnFromModification(event: LogEvent): Promise<void> {
    const mod = event.data.modification as any
    if (!mod) return
    
    // Apprendre la couleur préférée
    if (mod.lineColor) {
      await this.updateColorPreference(mod.lineColor)
    }
    
    // Apprendre les préférences de graphique
    if (mod.showMarkers !== undefined) {
      await this.updatePreference(
        'chart_type', 
        'show_markers', 
        mod.showMarkers ? 'true' : 'false'
      )
    }
    
    if (mod.showTrendLine !== undefined) {
      await this.updatePreference(
        'chart_type', 
        'show_trend', 
        mod.showTrendLine ? 'true' : 'false'
      )
    }
  }
  
  /**
   * Apprend d'une correction utilisateur
   */
  private async learnFromCorrection(event: LogEvent): Promise<void> {
    const logs = await this.store.getLogs({ 
      sessionId: this.sessionId, 
      limit: 5 
    })
    
    // Trouver le message précédent
    const previousMessages = logs.filter(l => l.type === 'message_received')
    if (previousMessages.length < 2) return
    
    const lastResponse = previousMessages[previousMessages.length - 2]
    
    const correction: LearnedCorrection = {
      id: generateId(),
      originalInput: lastResponse.data.input || '',
      originalOutput: lastResponse.data.output || '',
      correction: event.data.input || '',
      category: this.categorizeCorrection(event.data.input || ''),
      learnedAt: new Date(),
      applied: false
    }
    
    await this.store.addCorrection(correction)
  }
  
  /**
   * Catégorise une correction
   */
  private categorizeCorrection(input: string): string {
    const lower = input.toLowerCase()
    
    if (lower.includes('non') || lower.includes("pas ça")) {
      return 'wrong_action'
    }
    if (lower.includes('trop long') || lower.includes('plus court')) {
      return 'too_verbose'
    }
    if (lower.includes('trop court') || lower.includes('plus de détail')) {
      return 'too_brief'
    }
    if (lower.includes('comprends pas') || lower.includes('pas compris')) {
      return 'misunderstanding'
    }
    
    return 'other'
  }
  
  /**
   * Renforce une suggestion cliquée
   */
  private async reinforceSuggestion(event: LogEvent): Promise<void> {
    const suggestionText = event.data.input
    if (!suggestionText) return
    
    // Chercher un pattern existant
    const patterns = await this.store.getPatterns({ type: 'preference' })
    const existing = patterns.find(p => 
      p.pattern.actions.includes(suggestionText)
    )
    
    if (existing) {
      await this.store.updatePatternOccurrence(existing.id)
    } else {
      // Créer un nouveau pattern
      const pattern: UsagePattern = {
        id: generateId(),
        type: 'preference',
        pattern: {
          trigger: 'suggestion',
          actions: [suggestionText],
          frequency: 1
        },
        confidence: 0.3,
        firstSeen: new Date(),
        lastSeen: new Date(),
        occurrences: 1
      }
      await this.store.addPattern(pattern)
    }
  }
  
  // ===== PRÉFÉRENCES =====
  
  /**
   * Met à jour une préférence utilisateur
   */
  private async updatePreference(
    category: UserPreference['category'],
    key: string,
    value: string
  ): Promise<void> {
    const existing = await this.store.getPreference(key)
    
    if (existing) {
      // Augmenter la confiance si même valeur
      if (existing.value === value) {
        await this.store.updatePreferenceConfidence(existing.id, 0.1)
      } else {
        // Nouvelle valeur, réinitialiser
        existing.value = value
        existing.confidence = 0.5
        await this.store.setPreference(existing)
      }
    } else {
      // Nouvelle préférence
      const pref: UserPreference = {
        id: generateId(),
        userId: 'default',
        category,
        key,
        value,
        confidence: 0.5,
        learnedAt: new Date(),
        lastUsed: new Date(),
        usageCount: 1,
        source: 'implicit'
      }
      await this.store.setPreference(pref)
    }
  }
  
  /**
   * Met à jour la préférence de couleur
   */
  private async updateColorPreference(color: string): Promise<void> {
    await this.updatePreference('color', 'preferred_chart_color', color)
  }
  
  // ===== CONTEXTE ENRICHI =====
  
  /**
   * Génère un contexte enrichi pour améliorer les prompts
   */
  async getEnrichedContext(): Promise<EnrichedContext> {
    const preferences = await this.store.getPreferences()
    const patterns = await this.store.getPatterns({ minConfidence: 0.5 })
    const recentLogs = await this.store.getLogs({ 
      sessionId: this.sessionId, 
      limit: 20 
    })
    
    // Analyser l'humeur de la session
    const corrections = recentLogs.filter(l => l.type === 'correction_made').length
    const mood = corrections > 2 ? 'frustrated' : 
                 corrections === 0 ? 'satisfied' : 'neutral'
    
    // Extraire les sujets récents
    const topics = recentLogs
      .filter(l => l.type === 'message_sent')
      .map(l => this.extractTopic(l.data.input || ''))
      .filter(Boolean)
      .slice(-5)
    
    // Générer des suggestions basées sur l'historique
    const historySuggestions = await this.generateHistoryBasedSuggestions()
    const timeSuggestions = this.generateTimeBasedSuggestions()
    const contextSuggestions = this.generateContextBasedSuggestions(recentLogs)
    
    return {
      userPreferences: preferences,
      recentPatterns: patterns.slice(0, 10),
      sessionHistory: {
        messageCount: recentLogs.filter(l => l.type === 'message_sent').length,
        lastTopics: topics as string[],
        currentMood: mood
      },
      suggestions: {
        basedOnHistory: historySuggestions,
        basedOnTime: timeSuggestions,
        basedOnContext: contextSuggestions
      }
    }
  }
  
  /**
   * Extrait le sujet principal d'un message
   */
  private extractTopic(message: string): string | null {
    const lower = message.toLowerCase()
    
    if (lower.includes('couleur') || lower.includes('color')) return 'couleur'
    if (lower.includes('point') || lower.includes('marker')) return 'marqueurs'
    if (lower.includes('trend') || lower.includes('tendance')) return 'tendance'
    if (lower.includes('analyse') || lower.includes('explain')) return 'analyse'
    if (lower.includes('graphique') || lower.includes('chart')) return 'graphique'
    
    return null
  }
  
  /**
   * Génère des suggestions basées sur l'historique
   */
  private async generateHistoryBasedSuggestions(): Promise<string[]> {
    const patterns = await this.store.getPatterns({ 
      type: 'preference', 
      minConfidence: 0.6 
    })
    
    return patterns
      .flatMap(p => p.pattern.actions)
      .slice(0, 3)
  }
  
  /**
   * Génère des suggestions basées sur l'heure
   */
  private generateTimeBasedSuggestions(): string[] {
    const hour = new Date().getHours()
    
    if (hour >= 8 && hour < 12) {
      return ['Résumé du matin', 'Objectifs du jour']
    } else if (hour >= 12 && hour < 14) {
      return ['Bilan mi-journée']
    } else if (hour >= 17 && hour < 20) {
      return ['Bilan de la journée', 'Prévisions demain']
    }
    
    return []
  }
  
  /**
   * Génère des suggestions basées sur le contexte récent
   */
  private generateContextBasedSuggestions(logs: LogEvent[]): string[] {
    const suggestions: string[] = []
    
    const lastModification = logs
      .filter(l => l.type === 'modification_applied')
      .pop()
    
    if (lastModification) {
      const mod = lastModification.data.modification as any
      if (mod?.lineColor) {
        suggestions.push('Appliquer cette couleur aux autres graphiques')
      }
      if (mod?.showMarkers) {
        suggestions.push('Ajouter des annotations aux points clés')
      }
    }
    
    return suggestions
  }
  
  // ===== SUGGESTIONS INTELLIGENTES =====
  
  /**
   * Génère des suggestions intelligentes basées sur l'apprentissage
   */
  async getSmartSuggestions(currentContext?: object): Promise<SmartSuggestion[]> {
    const enriched = await this.getEnrichedContext()
    const suggestions: SmartSuggestion[] = []
    
    // Suggestions basées sur les préférences
    const colorPref = enriched.userPreferences.find(p => p.key === 'preferred_chart_color')
    if (colorPref && colorPref.confidence > 0.7) {
      suggestions.push({
        text: `Utiliser ma couleur préférée`,
        confidence: colorPref.confidence,
        source: 'preference',
        reason: 'Basé sur vos choix précédents'
      })
    }
    
    // Suggestions basées sur les patterns
    for (const pattern of enriched.recentPatterns.slice(0, 2)) {
      if (pattern.pattern.actions[0]) {
        suggestions.push({
          text: pattern.pattern.actions[0],
          confidence: pattern.confidence,
          source: 'pattern',
          reason: `Utilisé ${pattern.occurrences} fois`
        })
      }
    }
    
    // Suggestions contextuelles
    for (const suggestion of enriched.suggestions.basedOnContext) {
      suggestions.push({
        text: suggestion,
        confidence: 0.6,
        source: 'context'
      })
    }
    
    // Suggestions temporelles
    for (const suggestion of enriched.suggestions.basedOnTime) {
      suggestions.push({
        text: suggestion,
        confidence: 0.5,
        source: 'trending'
      })
    }
    
    // Trier par confiance et limiter
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
  }
  
  // ===== AMÉLIORATION DES PROMPTS =====
  
  /**
   * Enrichit un prompt avec les apprentissages
   */
  async enrichPrompt(basePrompt: string): Promise<string> {
    const context = await this.getEnrichedContext()
    const additions: string[] = []
    
    // Ajouter les préférences connues
    const highConfidencePrefs = context.userPreferences.filter(p => p.confidence > 0.7)
    if (highConfidencePrefs.length > 0) {
      additions.push('\n\n## Préférences utilisateur connues:')
      for (const pref of highConfidencePrefs) {
        additions.push(`- ${pref.key}: ${pref.value} (confiance: ${Math.round(pref.confidence * 100)}%)`)
      }
    }
    
    // Ajouter le style de réponse
    const stylePref = context.userPreferences.find(p => p.key === 'response_style')
    if (stylePref) {
      if (stylePref.value === 'concise') {
        additions.push('\n\n## Style de réponse: CONCIS - Réponses courtes et directes.')
      } else if (stylePref.value === 'analytical') {
        additions.push('\n\n## Style de réponse: ANALYTIQUE - Explications détaillées.')
      }
    }
    
    // Ajouter l'humeur détectée
    if (context.sessionHistory.currentMood === 'frustrated') {
      additions.push('\n\n## ATTENTION: L\'utilisateur semble frustré. Sois extra clair et direct.')
    }
    
    // Ajouter les corrections passées pertinentes
    const corrections = await this.store.getCorrections({ applied: false })
    const relevantCorrections = corrections.slice(-3)
    if (relevantCorrections.length > 0) {
      additions.push('\n\n## Erreurs passées à éviter:')
      for (const c of relevantCorrections) {
        additions.push(`- Quand "${c.originalInput.slice(0, 50)}...", ne pas "${c.category}"`)
      }
    }
    
    return basePrompt + additions.join('\n')
  }
  
  // ===== FEEDBACK =====
  
  /**
   * Enregistre un feedback utilisateur
   */
  async recordFeedback(
    messageId: string,
    type: 'helpful' | 'not_helpful' | 'wrong' | 'too_long' | 'too_short' | 'off_topic',
    comment?: string
  ): Promise<void> {
    await this.store.addFeedback({
      id: generateId(),
      sessionId: this.sessionId,
      messageId,
      type,
      comment,
      timestamp: new Date()
    })
    
    // Mettre à jour les métriques
    const metrics = await this.store.getMetrics()
    if (type === 'helpful') {
      metrics.successfulResponses++
    }
    metrics.averageSatisfaction = this.calculateSatisfaction(type, metrics.averageSatisfaction)
    await this.store.updateMetrics(metrics)
  }
  
  private calculateSatisfaction(
    feedbackType: string, 
    currentAvg: number
  ): number {
    const scores: Record<string, number> = {
      helpful: 1,
      not_helpful: 0.3,
      wrong: 0,
      too_long: 0.5,
      too_short: 0.5,
      off_topic: 0.2
    }
    
    const score = scores[feedbackType] ?? 0.5
    // Moyenne mobile
    return currentAvg * 0.9 + score * 0.1
  }
  
  // ===== EXPORT =====
  
  /**
   * Exporte toutes les données d'apprentissage
   */
  async exportLearningData(): Promise<object> {
    return this.store.exportAll()
  }
  
  /**
   * Importe des données d'apprentissage
   */
  async importLearningData(data: object): Promise<void> {
    return this.store.importAll(data)
  }
}

// Factory pour créer une instance
export function createLearningService(sessionId?: string): LearningService {
  return new LearningService(sessionId)
}

export default LearningService

