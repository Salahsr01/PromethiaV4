/**
 * Service de détection de patterns
 * 
 * Analyse les séquences d'actions pour identifier des patterns récurrents
 * et prédire les prochaines actions de l'utilisateur.
 */

import { LogEvent, UsagePattern } from '../types/memory'
import { getMemoryStore } from '../stores/MemoryStore'

// Types de patterns détectables
type PatternType = 
  | 'color_sequence'      // Séquence de changements de couleur
  | 'action_chain'        // Chaîne d'actions liées
  | 'time_based'          // Pattern basé sur l'heure
  | 'correction_pattern'  // Pattern de corrections
  | 'exploration'         // Pattern d'exploration
  | 'refinement'          // Pattern de raffinement

interface DetectedPattern {
  type: PatternType
  sequence: string[]
  confidence: number
  predictedNext?: string
  context?: object
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export class PatternDetector {
  private store = getMemoryStore()
  private minSequenceLength = 2
  private maxSequenceLength = 5
  
  /**
   * Analyse les logs récents pour détecter des patterns
   */
  async detectPatterns(logs: LogEvent[]): Promise<DetectedPattern[]> {
    const detected: DetectedPattern[] = []
    
    // Détecter les séquences d'actions
    const actionPatterns = this.detectActionSequences(logs)
    detected.push(...actionPatterns)
    
    // Détecter les patterns de couleur
    const colorPatterns = this.detectColorPatterns(logs)
    detected.push(...colorPatterns)
    
    // Détecter les patterns temporels
    const timePatterns = this.detectTimePatterns(logs)
    detected.push(...timePatterns)
    
    // Détecter les patterns de correction
    const correctionPatterns = this.detectCorrectionPatterns(logs)
    detected.push(...correctionPatterns)
    
    // Sauvegarder les patterns de haute confiance
    for (const pattern of detected.filter(p => p.confidence > 0.6)) {
      await this.savePattern(pattern)
    }
    
    return detected.sort((a, b) => b.confidence - a.confidence)
  }
  
  /**
   * Détecte les séquences d'actions récurrentes
   */
  private detectActionSequences(logs: LogEvent[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = []
    const actions = logs
      .filter(l => l.type === 'message_sent')
      .map(l => this.normalizeAction(l.data.input || ''))
      .filter(Boolean)
    
    if (actions.length < this.minSequenceLength) return patterns
    
    // Chercher des séquences répétées
    for (let seqLen = this.minSequenceLength; seqLen <= this.maxSequenceLength; seqLen++) {
      const sequences = new Map<string, number>()
      
      for (let i = 0; i <= actions.length - seqLen; i++) {
        const seq = actions.slice(i, i + seqLen).join('|')
        sequences.set(seq, (sequences.get(seq) || 0) + 1)
      }
      
      // Patterns qui apparaissent plus d'une fois
      for (const [seq, count] of sequences) {
        if (count > 1) {
          const sequence = seq.split('|')
          patterns.push({
            type: 'action_chain',
            sequence,
            confidence: Math.min(0.9, 0.3 + count * 0.15),
            predictedNext: this.predictNextAction(sequence, actions)
          })
        }
      }
    }
    
    return patterns
  }
  
  /**
   * Normalise une action pour la comparaison
   */
  private normalizeAction(input: string): string {
    const lower = input.toLowerCase().trim()
    
    // Catégoriser les actions courantes
    if (/couleur|color|bleu|vert|rouge|orange/.test(lower)) return 'change_color'
    if (/point|marker|marqueur/.test(lower)) return 'toggle_markers'
    if (/tendance|trend/.test(lower)) return 'toggle_trend'
    if (/analyse|explain|pourquoi/.test(lower)) return 'request_analysis'
    if (/seuil|threshold|ligne/.test(lower)) return 'add_threshold'
    if (/reset|réinitialiser|original/.test(lower)) return 'reset'
    if (/supprime|enlève|retire/.test(lower)) return 'remove'
    if (/ajoute|add|montre/.test(lower)) return 'add'
    
    return 'other'
  }
  
  /**
   * Prédit la prochaine action basée sur une séquence
   */
  private predictNextAction(sequence: string[], allActions: string[]): string | undefined {
    // Chercher ce qui suit généralement cette séquence
    const seqStr = sequence.join('|')
    const followers = new Map<string, number>()
    
    for (let i = 0; i < allActions.length - sequence.length; i++) {
      const currentSeq = allActions.slice(i, i + sequence.length).join('|')
      if (currentSeq === seqStr && i + sequence.length < allActions.length) {
        const next = allActions[i + sequence.length]
        followers.set(next, (followers.get(next) || 0) + 1)
      }
    }
    
    // Retourner l'action la plus fréquente
    let maxCount = 0
    let predicted: string | undefined
    
    for (const [action, count] of followers) {
      if (count > maxCount) {
        maxCount = count
        predicted = action
      }
    }
    
    return predicted
  }
  
  /**
   * Détecte les patterns de couleur
   */
  private detectColorPatterns(logs: LogEvent[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = []
    
    const colorChanges = logs
      .filter(l => l.type === 'modification_applied')
      .map(l => (l.data.modification as any)?.lineColor)
      .filter(Boolean)
    
    if (colorChanges.length < 2) return patterns
    
    // Couleur la plus utilisée
    const colorCounts = new Map<string, number>()
    for (const color of colorChanges) {
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1)
    }
    
    const sortedColors = [...colorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
    
    if (sortedColors.length > 0) {
      const [favoriteColor, count] = sortedColors[0]
      patterns.push({
        type: 'color_sequence',
        sequence: [favoriteColor],
        confidence: Math.min(0.95, count / colorChanges.length),
        context: { favoriteColor, usageCount: count }
      })
    }
    
    return patterns
  }
  
  /**
   * Détecte les patterns temporels
   */
  private detectTimePatterns(logs: LogEvent[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = []
    
    // Grouper par heure
    const hourCounts = new Map<number, number>()
    for (const log of logs) {
      const hour = new Date(log.timestamp).getHours()
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
    }
    
    // Trouver les heures de pic
    const sortedHours = [...hourCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    
    if (sortedHours.length > 0) {
      patterns.push({
        type: 'time_based',
        sequence: sortedHours.map(([h]) => `${h}h`),
        confidence: 0.7,
        context: { 
          peakHours: sortedHours.map(([h, c]) => ({ hour: h, count: c }))
        }
      })
    }
    
    return patterns
  }
  
  /**
   * Détecte les patterns de correction
   */
  private detectCorrectionPatterns(logs: LogEvent[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = []
    
    const corrections = logs.filter(l => l.type === 'correction_made')
    if (corrections.length < 2) return patterns
    
    // Analyser ce qui précède généralement une correction
    const precedingActions = new Map<string, number>()
    
    for (let i = 1; i < logs.length; i++) {
      if (logs[i].type === 'correction_made' && logs[i-1].type === 'message_received') {
        const prevAction = this.normalizeAction(logs[i-1].data.output || '')
        precedingActions.set(prevAction, (precedingActions.get(prevAction) || 0) + 1)
      }
    }
    
    // Identifier les actions qui causent souvent des corrections
    for (const [action, count] of precedingActions) {
      if (count >= 2) {
        patterns.push({
          type: 'correction_pattern',
          sequence: [action, 'correction'],
          confidence: Math.min(0.85, count * 0.2),
          context: { problematicAction: action, correctionCount: count }
        })
      }
    }
    
    return patterns
  }
  
  /**
   * Sauvegarde un pattern détecté
   */
  private async savePattern(detected: DetectedPattern): Promise<void> {
    const pattern: UsagePattern = {
      id: generateId(),
      type: detected.type === 'action_chain' ? 'sequence' : 
            detected.type === 'correction_pattern' ? 'correction' : 'preference',
      pattern: {
        trigger: detected.sequence[0],
        actions: detected.sequence,
        frequency: 1,
        context: detected.context
      },
      confidence: detected.confidence,
      firstSeen: new Date(),
      lastSeen: new Date(),
      occurrences: 1
    }
    
    await this.store.addPattern(pattern)
  }
  
  /**
   * Prédit les prochaines actions probables
   */
  async predictNextActions(currentAction: string, limit = 3): Promise<string[]> {
    const patterns = await this.store.getPatterns({ 
      type: 'sequence', 
      minConfidence: 0.5 
    })
    
    const normalized = this.normalizeAction(currentAction)
    const predictions: Map<string, number> = new Map()
    
    for (const pattern of patterns) {
      const actions = pattern.pattern.actions
      const idx = actions.indexOf(normalized)
      
      if (idx !== -1 && idx < actions.length - 1) {
        const next = actions[idx + 1]
        const score = pattern.confidence * (pattern.occurrences / 10)
        predictions.set(next, (predictions.get(next) || 0) + score)
      }
    }
    
    return [...predictions.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([action]) => this.denormalizeAction(action))
  }
  
  /**
   * Convertit une action normalisée en suggestion lisible
   */
  private denormalizeAction(normalized: string): string {
    const mapping: Record<string, string> = {
      'change_color': 'Changer la couleur',
      'toggle_markers': 'Afficher/masquer les points',
      'toggle_trend': 'Afficher la tendance',
      'request_analysis': 'Analyser les données',
      'add_threshold': 'Ajouter un seuil',
      'reset': 'Réinitialiser',
      'remove': 'Supprimer un élément',
      'add': 'Ajouter un élément'
    }
    
    return mapping[normalized] || normalized
  }
  
  /**
   * Analyse la session pour identifier le "mode" de l'utilisateur
   */
  async detectUserMode(logs: LogEvent[]): Promise<{
    mode: 'exploring' | 'refining' | 'analyzing' | 'building' | 'unknown'
    confidence: number
    indicators: string[]
  }> {
    const actions = logs
      .filter(l => l.type === 'message_sent')
      .map(l => this.normalizeAction(l.data.input || ''))
    
    const actionCounts = new Map<string, number>()
    for (const action of actions) {
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1)
    }
    
    const indicators: string[] = []
    
    // Mode exploration : beaucoup de changements différents
    const uniqueActions = actionCounts.size
    if (uniqueActions > actions.length * 0.7) {
      indicators.push('Beaucoup d\'actions différentes')
      return { mode: 'exploring', confidence: 0.7, indicators }
    }
    
    // Mode raffinement : répétition d'actions similaires
    const maxCount = Math.max(...actionCounts.values())
    if (maxCount > actions.length * 0.5) {
      indicators.push('Répétition d\'actions similaires')
      return { mode: 'refining', confidence: 0.8, indicators }
    }
    
    // Mode analyse : beaucoup de demandes d'explication
    const analysisCount = actionCounts.get('request_analysis') || 0
    if (analysisCount > actions.length * 0.3) {
      indicators.push('Nombreuses demandes d\'analyse')
      return { mode: 'analyzing', confidence: 0.75, indicators }
    }
    
    // Mode construction : ajouts successifs
    const addCount = actionCounts.get('add') || 0
    if (addCount > actions.length * 0.4) {
      indicators.push('Nombreux ajouts')
      return { mode: 'building', confidence: 0.7, indicators }
    }
    
    return { mode: 'unknown', confidence: 0.3, indicators }
  }
}

export function createPatternDetector(): PatternDetector {
  return new PatternDetector()
}

export default PatternDetector

