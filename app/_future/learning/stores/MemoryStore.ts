/**
 * Store de mémoire persistante pour l'apprentissage IA
 * 
 * Ce store gère le stockage et la récupération des données d'apprentissage.
 * En production, cela serait connecté à une base de données (PostgreSQL, MongoDB, etc.)
 * Pour l'instant, utilise le localStorage côté client et des fichiers JSON côté serveur.
 */

import { 
  LogEvent, 
  UserPreference, 
  UsagePattern, 
  LearnedCorrection,
  UserSession,
  LearningMetrics,
  FeedbackEntry 
} from '../types/memory'

// Clés de stockage
const STORAGE_KEYS = {
  LOGS: 'promethia_logs',
  PREFERENCES: 'promethia_preferences',
  PATTERNS: 'promethia_patterns',
  CORRECTIONS: 'promethia_corrections',
  SESSIONS: 'promethia_sessions',
  METRICS: 'promethia_metrics',
  FEEDBACK: 'promethia_feedback'
}

// Interface pour le store
interface IMemoryStore {
  // Logs
  addLog(event: LogEvent): Promise<void>
  getLogs(options?: { limit?: number; type?: string; sessionId?: string }): Promise<LogEvent[]>
  clearLogs(olderThan?: Date): Promise<void>
  
  // Préférences
  setPreference(pref: UserPreference): Promise<void>
  getPreferences(userId?: string): Promise<UserPreference[]>
  getPreference(key: string, userId?: string): Promise<UserPreference | null>
  updatePreferenceConfidence(id: string, delta: number): Promise<void>
  
  // Patterns
  addPattern(pattern: UsagePattern): Promise<void>
  getPatterns(options?: { type?: string; minConfidence?: number }): Promise<UsagePattern[]>
  updatePatternOccurrence(id: string): Promise<void>
  
  // Corrections
  addCorrection(correction: LearnedCorrection): Promise<void>
  getCorrections(options?: { category?: string; applied?: boolean }): Promise<LearnedCorrection[]>
  markCorrectionApplied(id: string): Promise<void>
  
  // Sessions
  startSession(session: UserSession): Promise<void>
  endSession(sessionId: string): Promise<void>
  getSession(sessionId: string): Promise<UserSession | null>
  getRecentSessions(limit?: number): Promise<UserSession[]>
  
  // Métriques
  getMetrics(): Promise<LearningMetrics>
  updateMetrics(updates: Partial<LearningMetrics>): Promise<void>
  
  // Feedback
  addFeedback(feedback: FeedbackEntry): Promise<void>
  getFeedback(options?: { type?: string; sessionId?: string }): Promise<FeedbackEntry[]>
  
  // Export/Import
  exportAll(): Promise<object>
  importAll(data: object): Promise<void>
}

/**
 * Implémentation en mémoire avec persistance localStorage
 * Pour le développement et les tests
 */
export class InMemoryStore implements IMemoryStore {
  private logs: LogEvent[] = []
  private preferences: Map<string, UserPreference> = new Map()
  private patterns: Map<string, UsagePattern> = new Map()
  private corrections: Map<string, LearnedCorrection> = new Map()
  private sessions: Map<string, UserSession> = new Map()
  private feedback: FeedbackEntry[] = []
  private metrics: LearningMetrics = {
    totalInteractions: 0,
    successfulResponses: 0,
    corrections: 0,
    patternsDetected: 0,
    preferencesLearned: 0,
    averageSatisfaction: 0.8,
    improvementRate: 0
  }
  
  constructor() {
    this.loadFromStorage()
  }
  
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const logs = localStorage.getItem(STORAGE_KEYS.LOGS)
      if (logs) this.logs = JSON.parse(logs)
      
      const prefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
      if (prefs) {
        const parsed = JSON.parse(prefs)
        parsed.forEach((p: UserPreference) => this.preferences.set(p.id, p))
      }
      
      const patterns = localStorage.getItem(STORAGE_KEYS.PATTERNS)
      if (patterns) {
        const parsed = JSON.parse(patterns)
        parsed.forEach((p: UsagePattern) => this.patterns.set(p.id, p))
      }
      
      const corrections = localStorage.getItem(STORAGE_KEYS.CORRECTIONS)
      if (corrections) {
        const parsed = JSON.parse(corrections)
        parsed.forEach((c: LearnedCorrection) => this.corrections.set(c.id, c))
      }
      
      const metrics = localStorage.getItem(STORAGE_KEYS.METRICS)
      if (metrics) this.metrics = JSON.parse(metrics)
      
      const feedback = localStorage.getItem(STORAGE_KEYS.FEEDBACK)
      if (feedback) this.feedback = JSON.parse(feedback)
    } catch (error) {
      console.warn('Erreur chargement mémoire:', error)
    }
  }
  
  private saveToStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      // Limiter les logs à 1000 entrées
      const logsToSave = this.logs.slice(-1000)
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logsToSave))
      
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, 
        JSON.stringify(Array.from(this.preferences.values())))
      
      localStorage.setItem(STORAGE_KEYS.PATTERNS, 
        JSON.stringify(Array.from(this.patterns.values())))
      
      localStorage.setItem(STORAGE_KEYS.CORRECTIONS, 
        JSON.stringify(Array.from(this.corrections.values())))
      
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(this.metrics))
      
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, 
        JSON.stringify(this.feedback.slice(-500)))
    } catch (error) {
      console.warn('Erreur sauvegarde mémoire:', error)
    }
  }
  
  // === LOGS ===
  async addLog(event: LogEvent): Promise<void> {
    this.logs.push(event)
    this.metrics.totalInteractions++
    this.saveToStorage()
  }
  
  async getLogs(options?: { limit?: number; type?: string; sessionId?: string }): Promise<LogEvent[]> {
    let result = [...this.logs]
    
    if (options?.type) {
      result = result.filter(l => l.type === options.type)
    }
    if (options?.sessionId) {
      result = result.filter(l => l.sessionId === options.sessionId)
    }
    if (options?.limit) {
      result = result.slice(-options.limit)
    }
    
    return result
  }
  
  async clearLogs(olderThan?: Date): Promise<void> {
    if (olderThan) {
      this.logs = this.logs.filter(l => new Date(l.timestamp) > olderThan)
    } else {
      this.logs = []
    }
    this.saveToStorage()
  }
  
  // === PREFERENCES ===
  async setPreference(pref: UserPreference): Promise<void> {
    this.preferences.set(pref.id, pref)
    this.metrics.preferencesLearned = this.preferences.size
    this.saveToStorage()
  }
  
  async getPreferences(userId?: string): Promise<UserPreference[]> {
    const all = Array.from(this.preferences.values())
    if (userId) {
      return all.filter(p => p.userId === userId)
    }
    return all
  }
  
  async getPreference(key: string, userId?: string): Promise<UserPreference | null> {
    const all = Array.from(this.preferences.values())
    return all.find(p => p.key === key && (!userId || p.userId === userId)) || null
  }
  
  async updatePreferenceConfidence(id: string, delta: number): Promise<void> {
    const pref = this.preferences.get(id)
    if (pref) {
      pref.confidence = Math.max(0, Math.min(1, pref.confidence + delta))
      pref.usageCount++
      pref.lastUsed = new Date()
      this.saveToStorage()
    }
  }
  
  // === PATTERNS ===
  async addPattern(pattern: UsagePattern): Promise<void> {
    this.patterns.set(pattern.id, pattern)
    this.metrics.patternsDetected = this.patterns.size
    this.saveToStorage()
  }
  
  async getPatterns(options?: { type?: string; minConfidence?: number }): Promise<UsagePattern[]> {
    let result = Array.from(this.patterns.values())
    
    if (options?.type) {
      result = result.filter(p => p.type === options.type)
    }
    if (options?.minConfidence !== undefined) {
      result = result.filter(p => p.confidence >= (options.minConfidence || 0))
    }
    
    return result.sort((a, b) => b.confidence - a.confidence)
  }
  
  async updatePatternOccurrence(id: string): Promise<void> {
    const pattern = this.patterns.get(id)
    if (pattern) {
      pattern.occurrences++
      pattern.lastSeen = new Date()
      pattern.confidence = Math.min(1, pattern.confidence + 0.05)
      this.saveToStorage()
    }
  }
  
  // === CORRECTIONS ===
  async addCorrection(correction: LearnedCorrection): Promise<void> {
    this.corrections.set(correction.id, correction)
    this.metrics.corrections++
    this.saveToStorage()
  }
  
  async getCorrections(options?: { category?: string; applied?: boolean }): Promise<LearnedCorrection[]> {
    let result = Array.from(this.corrections.values())
    
    if (options?.category) {
      result = result.filter(c => c.category === options.category)
    }
    if (options?.applied !== undefined) {
      result = result.filter(c => c.applied === options.applied)
    }
    
    return result
  }
  
  async markCorrectionApplied(id: string): Promise<void> {
    const correction = this.corrections.get(id)
    if (correction) {
      correction.applied = true
      this.saveToStorage()
    }
  }
  
  // === SESSIONS ===
  async startSession(session: UserSession): Promise<void> {
    this.sessions.set(session.id, session)
  }
  
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.endedAt = new Date()
      // Calculer le résumé
      session.summary = {
        messageCount: session.events.filter(e => e.type === 'message_sent').length,
        modificationsCount: session.events.filter(e => e.type === 'modification_applied').length,
        suggestionsClicked: session.events.filter(e => e.type === 'suggestion_clicked').length,
        suggestionsIgnored: session.events.filter(e => e.type === 'suggestion_ignored').length,
        corrections: session.events.filter(e => e.type === 'correction_made').length,
        averageResponseTime: this.calculateAverageResponseTime(session.events)
      }
    }
  }
  
  private calculateAverageResponseTime(events: LogEvent[]): number {
    const responseTimes = events
      .filter(e => e.data.duration)
      .map(e => e.data.duration!)
    
    if (responseTimes.length === 0) return 0
    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
  }
  
  async getSession(sessionId: string): Promise<UserSession | null> {
    return this.sessions.get(sessionId) || null
  }
  
  async getRecentSessions(limit = 10): Promise<UserSession[]> {
    return Array.from(this.sessions.values())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit)
  }
  
  // === METRICS ===
  async getMetrics(): Promise<LearningMetrics> {
    return { ...this.metrics }
  }
  
  async updateMetrics(updates: Partial<LearningMetrics>): Promise<void> {
    this.metrics = { ...this.metrics, ...updates }
    this.saveToStorage()
  }
  
  // === FEEDBACK ===
  async addFeedback(feedback: FeedbackEntry): Promise<void> {
    this.feedback.push(feedback)
    this.saveToStorage()
  }
  
  async getFeedback(options?: { type?: string; sessionId?: string }): Promise<FeedbackEntry[]> {
    let result = [...this.feedback]
    
    if (options?.type) {
      result = result.filter(f => f.type === options.type)
    }
    if (options?.sessionId) {
      result = result.filter(f => f.sessionId === options.sessionId)
    }
    
    return result
  }
  
  // === EXPORT/IMPORT ===
  async exportAll(): Promise<object> {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      logs: this.logs,
      preferences: Array.from(this.preferences.values()),
      patterns: Array.from(this.patterns.values()),
      corrections: Array.from(this.corrections.values()),
      metrics: this.metrics,
      feedback: this.feedback
    }
  }
  
  async importAll(data: any): Promise<void> {
    if (data.logs) this.logs = data.logs
    if (data.preferences) {
      data.preferences.forEach((p: UserPreference) => this.preferences.set(p.id, p))
    }
    if (data.patterns) {
      data.patterns.forEach((p: UsagePattern) => this.patterns.set(p.id, p))
    }
    if (data.corrections) {
      data.corrections.forEach((c: LearnedCorrection) => this.corrections.set(c.id, c))
    }
    if (data.metrics) this.metrics = data.metrics
    if (data.feedback) this.feedback = data.feedback
    
    this.saveToStorage()
  }
}

// Singleton pour l'application
let storeInstance: InMemoryStore | null = null

export function getMemoryStore(): InMemoryStore {
  if (!storeInstance) {
    storeInstance = new InMemoryStore()
  }
  return storeInstance
}

export default InMemoryStore

