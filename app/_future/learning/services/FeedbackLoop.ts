/**
 * Boucle de rétroaction pour l'amélioration continue
 * 
 * Ce service analyse les feedbacks et les corrections pour
 * améliorer automatiquement les réponses de l'IA.
 */

import { 
  LogEvent, 
  LearnedCorrection, 
  FeedbackEntry,
  LearningMetrics 
} from '../types/memory'
import { getMemoryStore } from '../stores/MemoryStore'

// Types de problèmes identifiables
type ProblemType = 
  | 'too_verbose'       // Réponses trop longues
  | 'too_brief'         // Réponses trop courtes
  | 'misunderstanding'  // Mauvaise compréhension
  | 'wrong_action'      // Action incorrecte
  | 'slow_response'     // Réponse lente
  | 'off_topic'         // Hors sujet
  | 'technical_error'   // Erreur technique

// Recommandation d'amélioration
interface Improvement {
  id: string
  type: ProblemType
  description: string
  priority: 'high' | 'medium' | 'low'
  suggestedFix: string
  affectedPrompts: string[]
  createdAt: Date
  implemented: boolean
}

// Rapport de qualité
interface QualityReport {
  period: { start: Date; end: Date }
  metrics: {
    totalInteractions: number
    successRate: number
    averageResponseTime: number
    correctionRate: number
    satisfactionScore: number
  }
  topProblems: { type: ProblemType; count: number; examples: string[] }[]
  improvements: Improvement[]
  trends: {
    direction: 'improving' | 'declining' | 'stable'
    changePercent: number
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export class FeedbackLoop {
  private store = getMemoryStore()
  private improvements: Improvement[] = []
  
  /**
   * Analyse les feedbacks récents et génère des recommandations
   */
  async analyzeFeedback(): Promise<Improvement[]> {
    const feedback = await this.store.getFeedback()
    const corrections = await this.store.getCorrections()
    const logs = await this.store.getLogs({ limit: 500 })
    
    const problems = this.identifyProblems(feedback, corrections, logs)
    const improvements = this.generateImprovements(problems)
    
    this.improvements = improvements
    return improvements
  }
  
  /**
   * Identifie les problèmes à partir des données
   */
  private identifyProblems(
    feedback: FeedbackEntry[],
    corrections: LearnedCorrection[],
    logs: LogEvent[]
  ): Map<ProblemType, { count: number; examples: string[] }> {
    const problems = new Map<ProblemType, { count: number; examples: string[] }>()
    
    // Initialiser
    const types: ProblemType[] = [
      'too_verbose', 'too_brief', 'misunderstanding', 
      'wrong_action', 'slow_response', 'off_topic', 'technical_error'
    ]
    types.forEach(t => problems.set(t, { count: 0, examples: [] }))
    
    // Analyser les feedbacks explicites
    for (const fb of feedback) {
      const type = this.mapFeedbackToType(fb.type)
      const problem = problems.get(type)!
      problem.count++
      if (fb.comment) {
        problem.examples.push(fb.comment)
      }
    }
    
    // Analyser les corrections
    for (const correction of corrections) {
      const type = correction.category as ProblemType || 'misunderstanding'
      const problem = problems.get(type) || { count: 0, examples: [] }
      problem.count++
      problem.examples.push(`"${correction.originalInput}" → "${correction.correction}"`)
      problems.set(type, problem)
    }
    
    // Analyser les temps de réponse
    const responseTimes = logs
      .filter(l => l.type === 'message_received' && l.data.duration)
      .map(l => l.data.duration!)
    
    if (responseTimes.length > 0) {
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      if (avgTime > 3000) { // Plus de 3 secondes
        const slowProblem = problems.get('slow_response')!
        slowProblem.count = responseTimes.filter(t => t > 3000).length
        slowProblem.examples.push(`Temps moyen: ${Math.round(avgTime)}ms`)
      }
    }
    
    // Analyser les patterns de répétition (signe de mauvaise compréhension)
    const messages = logs.filter(l => l.type === 'message_sent')
    let repetitions = 0
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i-1].data.input?.toLowerCase() || ''
      const curr = messages[i].data.input?.toLowerCase() || ''
      if (this.isSimilar(prev, curr)) {
        repetitions++
      }
    }
    if (repetitions > 3) {
      const misunderstanding = problems.get('misunderstanding')!
      misunderstanding.count += repetitions
      misunderstanding.examples.push(`${repetitions} messages répétés détectés`)
    }
    
    return problems
  }
  
  /**
   * Mappe un type de feedback à un type de problème
   */
  private mapFeedbackToType(feedbackType: string): ProblemType {
    const mapping: Record<string, ProblemType> = {
      'not_helpful': 'misunderstanding',
      'wrong': 'wrong_action',
      'too_long': 'too_verbose',
      'too_short': 'too_brief',
      'off_topic': 'off_topic'
    }
    return mapping[feedbackType] || 'misunderstanding'
  }
  
  /**
   * Vérifie si deux messages sont similaires
   */
  private isSimilar(a: string, b: string): boolean {
    if (a === b) return true
    
    // Comparaison simple basée sur les mots clés
    const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 3))
    const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 3))
    
    let common = 0
    for (const word of wordsA) {
      if (wordsB.has(word)) common++
    }
    
    const similarity = common / Math.max(wordsA.size, wordsB.size)
    return similarity > 0.6
  }
  
  /**
   * Génère des recommandations d'amélioration
   */
  private generateImprovements(
    problems: Map<ProblemType, { count: number; examples: string[] }>
  ): Improvement[] {
    const improvements: Improvement[] = []
    
    const fixes: Record<ProblemType, { description: string; fix: string; prompts: string[] }> = {
      'too_verbose': {
        description: 'Les réponses sont souvent trop longues',
        fix: 'Ajouter une instruction de concision dans le prompt système',
        prompts: ['Sois concis et direct.', 'Limite ta réponse à 2-3 phrases.']
      },
      'too_brief': {
        description: 'Les réponses manquent de détails',
        fix: 'Demander plus de contexte dans les explications',
        prompts: ['Fournis des explications détaillées.', 'Développe ta réponse.']
      },
      'misunderstanding': {
        description: 'L\'IA ne comprend pas bien les demandes',
        fix: 'Améliorer la détection d\'intention et demander clarification',
        prompts: ['Si tu n\'es pas sûr, demande clarification.', 'Reformule la demande avant d\'agir.']
      },
      'wrong_action': {
        description: 'L\'IA effectue des actions incorrectes',
        fix: 'Ajouter une étape de confirmation pour les actions importantes',
        prompts: ['Confirme avant d\'effectuer une modification.', 'Décris ce que tu vas faire avant de le faire.']
      },
      'slow_response': {
        description: 'Les temps de réponse sont trop longs',
        fix: 'Optimiser les prompts et réduire leur longueur',
        prompts: ['Réponds rapidement.']
      },
      'off_topic': {
        description: 'Les réponses sont hors sujet',
        fix: 'Recentrer sur le contexte du dashboard',
        prompts: ['Reste focalisé sur le tableau de bord et les graphiques.']
      },
      'technical_error': {
        description: 'Des erreurs techniques surviennent',
        fix: 'Améliorer la gestion des erreurs',
        prompts: ['Gère les erreurs gracieusement.']
      }
    }
    
    for (const [type, { count, examples }] of problems) {
      if (count === 0) continue
      
      const priority = count > 10 ? 'high' : count > 5 ? 'medium' : 'low'
      const fixInfo = fixes[type]
      
      improvements.push({
        id: generateId(),
        type,
        description: `${fixInfo.description} (${count} occurrences)`,
        priority,
        suggestedFix: fixInfo.fix,
        affectedPrompts: fixInfo.prompts,
        createdAt: new Date(),
        implemented: false
      })
    }
    
    return improvements.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
  
  /**
   * Génère un rapport de qualité complet
   */
  async generateQualityReport(days = 7): Promise<QualityReport> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const logs = await this.store.getLogs()
    const recentLogs = logs.filter(l => new Date(l.timestamp) >= startDate)
    
    const feedback = await this.store.getFeedback()
    const recentFeedback = feedback.filter(f => new Date(f.timestamp) >= startDate)
    
    const corrections = await this.store.getCorrections()
    const recentCorrections = corrections.filter(c => new Date(c.learnedAt) >= startDate)
    
    // Calculer les métriques
    const totalInteractions = recentLogs.filter(l => l.type === 'message_sent').length
    const successfulResponses = recentLogs.filter(l => 
      l.type === 'message_received' && l.data.success
    ).length
    
    const responseTimes = recentLogs
      .filter(l => l.type === 'message_received' && l.data.duration)
      .map(l => l.data.duration!)
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0
    
    const problems = this.identifyProblems(recentFeedback, recentCorrections, recentLogs)
    const improvements = this.generateImprovements(problems)
    
    // Calculer les tendances
    const metrics = await this.store.getMetrics()
    const previousSuccessRate = metrics.successfulResponses / Math.max(1, metrics.totalInteractions)
    const currentSuccessRate = successfulResponses / Math.max(1, totalInteractions)
    
    const changePercent = ((currentSuccessRate - previousSuccessRate) / Math.max(0.01, previousSuccessRate)) * 100
    
    return {
      period: { start: startDate, end: new Date() },
      metrics: {
        totalInteractions,
        successRate: currentSuccessRate,
        averageResponseTime: avgResponseTime,
        correctionRate: recentCorrections.length / Math.max(1, totalInteractions),
        satisfactionScore: metrics.averageSatisfaction
      },
      topProblems: [...problems.entries()]
        .filter(([, v]) => v.count > 0)
        .map(([type, { count, examples }]) => ({ type, count, examples: examples.slice(0, 3) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      improvements,
      trends: {
        direction: changePercent > 5 ? 'improving' : changePercent < -5 ? 'declining' : 'stable',
        changePercent: Math.round(changePercent * 10) / 10
      }
    }
  }
  
  /**
   * Génère un prompt amélioré basé sur les feedbacks
   */
  async generateImprovedPromptAdditions(): Promise<string[]> {
    const improvements = await this.analyzeFeedback()
    
    const additions: string[] = []
    
    for (const improvement of improvements.filter(i => i.priority === 'high')) {
      additions.push(...improvement.affectedPrompts)
    }
    
    // Dédupliquer
    return [...new Set(additions)]
  }
  
  /**
   * Marque une amélioration comme implémentée
   */
  markImplemented(improvementId: string): void {
    const improvement = this.improvements.find(i => i.id === improvementId)
    if (improvement) {
      improvement.implemented = true
    }
  }
  
  /**
   * Calcule un score de santé global du système
   */
  async calculateHealthScore(): Promise<{
    score: number // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor'
    factors: { name: string; score: number; weight: number }[]
  }> {
    const metrics = await this.store.getMetrics()
    const report = await this.generateQualityReport(7)
    
    const factors = [
      {
        name: 'Taux de succès',
        score: Math.min(100, report.metrics.successRate * 100),
        weight: 0.3
      },
      {
        name: 'Satisfaction',
        score: Math.min(100, report.metrics.satisfactionScore * 100),
        weight: 0.25
      },
      {
        name: 'Temps de réponse',
        score: Math.max(0, 100 - (report.metrics.averageResponseTime / 50)), // <5s = 100
        weight: 0.15
      },
      {
        name: 'Taux de correction',
        score: Math.max(0, 100 - report.metrics.correctionRate * 500), // <20% = 100
        weight: 0.2
      },
      {
        name: 'Tendance',
        score: report.trends.direction === 'improving' ? 100 :
               report.trends.direction === 'stable' ? 70 : 40,
        weight: 0.1
      }
    ]
    
    const totalScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0)
    
    const status = totalScore >= 85 ? 'excellent' :
                   totalScore >= 70 ? 'good' :
                   totalScore >= 50 ? 'fair' : 'poor'
    
    return {
      score: Math.round(totalScore),
      status,
      factors
    }
  }
}

export function createFeedbackLoop(): FeedbackLoop {
  return new FeedbackLoop()
}

export default FeedbackLoop

