/**
 * Gestionnaire de plugins
 * 
 * Gère le cycle de vie des plugins: installation, activation,
 * désactivation, mise à jour et désinstallation.
 */

import {
  Plugin,
  PluginMetadata,
  PluginConfig,
  PluginContext,
  PluginState,
  PluginPermission,
  InstallResult,
  AICommand,
  CustomWidget,
  DataSource,
  CustomTheme,
  PluginEvent
} from './plugin'

// Stockage des plugins
interface PluginStore {
  plugins: Map<string, Plugin>
  states: Map<string, PluginState>
  configs: Map<string, PluginConfig>
}

const store: PluginStore = {
  plugins: new Map(),
  states: new Map(),
  configs: new Map()
}

// Event emitter simple
const eventHandlers: Map<PluginEvent, Set<(...args: any[]) => void>> = new Map()

export class PluginManager {
  private static instance: PluginManager
  
  private constructor() {}
  
  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager()
    }
    return PluginManager.instance
  }
  
  // ===== INSTALLATION =====
  
  /**
   * Installe un plugin
   */
  async install(plugin: Plugin): Promise<InstallResult> {
    const { id } = plugin.metadata
    
    // Vérifier si déjà installé
    if (store.plugins.has(id)) {
      return { success: false, error: `Plugin ${id} déjà installé` }
    }
    
    // Valider le plugin
    const validation = this.validatePlugin(plugin)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }
    
    // Créer la configuration par défaut
    const defaultConfig: PluginConfig = {
      enabled: false,
      settings: {},
      permissions: []
    }
    
    // Créer l'état initial
    const state: PluginState = {
      id,
      metadata: plugin.metadata,
      config: defaultConfig,
      status: 'installed'
    }
    
    // Enregistrer
    store.plugins.set(id, plugin)
    store.states.set(id, state)
    store.configs.set(id, defaultConfig)
    
    console.log(`Plugin ${plugin.metadata.name} (${id}) installé`)
    
    return { 
      success: true, 
      pluginId: id,
      warnings: validation.warnings 
    }
  }
  
  /**
   * Désinstalle un plugin
   */
  async uninstall(pluginId: string): Promise<boolean> {
    const plugin = store.plugins.get(pluginId)
    if (!plugin) return false
    
    // Désactiver d'abord si actif
    const state = store.states.get(pluginId)
    if (state?.status === 'enabled') {
      await this.disable(pluginId)
    }
    
    // Appeler le hook de déchargement
    if (plugin.onUnload) {
      try {
        await plugin.onUnload()
      } catch (error) {
        console.error(`Erreur lors du déchargement de ${pluginId}:`, error)
      }
    }
    
    // Supprimer
    store.plugins.delete(pluginId)
    store.states.delete(pluginId)
    store.configs.delete(pluginId)
    
    console.log(`Plugin ${pluginId} désinstallé`)
    
    return true
  }
  
  // ===== ACTIVATION =====
  
  /**
   * Active un plugin
   */
  async enable(pluginId: string, permissions?: PluginPermission[]): Promise<boolean> {
    const plugin = store.plugins.get(pluginId)
    const state = store.states.get(pluginId)
    const config = store.configs.get(pluginId)
    
    if (!plugin || !state || !config) {
      console.error(`Plugin ${pluginId} non trouvé`)
      return false
    }
    
    if (state.status === 'enabled') {
      return true // Déjà actif
    }
    
    // Mettre à jour les permissions
    if (permissions) {
      config.permissions = permissions
    }
    
    // Créer le contexte
    const context = this.createContext(pluginId)
    
    try {
      // Appeler le hook de chargement
      if (plugin.onLoad) {
        await plugin.onLoad(context)
      }
      
      // Appeler le hook d'activation
      if (plugin.onEnable) {
        await plugin.onEnable(context)
      }
      
      // Enregistrer les commandes IA
      if (plugin.commands) {
        this.registerAICommands(pluginId, plugin.commands)
      }
      
      // Mettre à jour l'état
      state.status = 'enabled'
      state.loadedAt = new Date()
      config.enabled = true
      
      console.log(`Plugin ${plugin.metadata.name} activé`)
      
      return true
    } catch (error) {
      state.status = 'error'
      state.error = error instanceof Error ? error.message : 'Erreur inconnue'
      console.error(`Erreur lors de l'activation de ${pluginId}:`, error)
      return false
    }
  }
  
  /**
   * Désactive un plugin
   */
  async disable(pluginId: string): Promise<boolean> {
    const plugin = store.plugins.get(pluginId)
    const state = store.states.get(pluginId)
    const config = store.configs.get(pluginId)
    
    if (!plugin || !state || !config) return false
    
    if (state.status !== 'enabled') {
      return true // Déjà désactivé
    }
    
    try {
      // Appeler le hook de désactivation
      if (plugin.onDisable) {
        await plugin.onDisable()
      }
      
      // Désenregistrer les commandes IA
      this.unregisterAICommands(pluginId)
      
      // Mettre à jour l'état
      state.status = 'disabled'
      state.loadedAt = undefined
      config.enabled = false
      
      console.log(`Plugin ${plugin.metadata.name} désactivé`)
      
      return true
    } catch (error) {
      console.error(`Erreur lors de la désactivation de ${pluginId}:`, error)
      return false
    }
  }
  
  // ===== CONTEXTE =====
  
  /**
   * Crée le contexte d'exécution pour un plugin
   */
  private createContext(pluginId: string): PluginContext {
    const config = store.configs.get(pluginId)!
    
    return {
      // Données
      getData: async (seriesId: string) => {
        this.checkPermission(pluginId, 'read:data')
        // En production, récupérer les vraies données
        return []
      },
      
      setData: async (seriesId: string, data: any[]) => {
        this.checkPermission(pluginId, 'write:data')
        // En production, sauvegarder les données
      },
      
      // Configuration
      getConfig: () => config,
      
      setConfig: async (settings: Partial<PluginConfig['settings']>) => {
        this.checkPermission(pluginId, 'write:config')
        Object.assign(config.settings, settings)
      },
      
      // UI
      showNotification: (message: string, type = 'info') => {
        console.log(`[${type.toUpperCase()}] ${message}`)
        // En production, afficher une vraie notification
      },
      
      showModal: (options: { title: string; content: any }) => {
        console.log(`Modal: ${options.title}`)
        // En production, afficher une vraie modale
      },
      
      // IA
      extendAI: (commands: AICommand[]) => {
        this.checkPermission(pluginId, 'ai:extend')
        this.registerAICommands(pluginId, commands)
      },
      
      // Événements
      on: (event: PluginEvent, handler: (...args: any[]) => void) => {
        if (!eventHandlers.has(event)) {
          eventHandlers.set(event, new Set())
        }
        eventHandlers.get(event)!.add(handler)
      },
      
      off: (event: PluginEvent, handler: (...args: any[]) => void) => {
        eventHandlers.get(event)?.delete(handler)
      },
      
      emit: (event: PluginEvent, ...args: any[]) => {
        eventHandlers.get(event)?.forEach(handler => {
          try {
            handler(...args)
          } catch (error) {
            console.error(`Erreur dans handler d'événement:`, error)
          }
        })
      },
      
      // Stockage
      storage: {
        get: async (key: string) => {
          this.checkPermission(pluginId, 'storage:local')
          const storageKey = `plugin:${pluginId}:${key}`
          if (typeof localStorage !== 'undefined') {
            const value = localStorage.getItem(storageKey)
            return value ? JSON.parse(value) : null
          }
          return null
        },
        
        set: async (key: string, value: any) => {
          this.checkPermission(pluginId, 'storage:local')
          const storageKey = `plugin:${pluginId}:${key}`
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(value))
          }
        },
        
        delete: async (key: string) => {
          this.checkPermission(pluginId, 'storage:local')
          const storageKey = `plugin:${pluginId}:${key}`
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(storageKey)
          }
        }
      },
      
      // Réseau
      fetch: async (url: string, options?: RequestInit) => {
        this.checkPermission(pluginId, 'network:outbound')
        return fetch(url, options)
      },
      
      // Logging
      log: {
        debug: (...args: any[]) => console.debug(`[${pluginId}]`, ...args),
        info: (...args: any[]) => console.info(`[${pluginId}]`, ...args),
        warn: (...args: any[]) => console.warn(`[${pluginId}]`, ...args),
        error: (...args: any[]) => console.error(`[${pluginId}]`, ...args)
      }
    }
  }
  
  // ===== PERMISSIONS =====
  
  /**
   * Vérifie si un plugin a une permission
   */
  private checkPermission(pluginId: string, permission: PluginPermission): void {
    const config = store.configs.get(pluginId)
    if (!config?.permissions.includes(permission)) {
      throw new Error(`Plugin ${pluginId} n'a pas la permission: ${permission}`)
    }
  }
  
  /**
   * Accorde une permission à un plugin
   */
  grantPermission(pluginId: string, permission: PluginPermission): boolean {
    const config = store.configs.get(pluginId)
    if (!config) return false
    
    if (!config.permissions.includes(permission)) {
      config.permissions.push(permission)
    }
    return true
  }
  
  /**
   * Révoque une permission
   */
  revokePermission(pluginId: string, permission: PluginPermission): boolean {
    const config = store.configs.get(pluginId)
    if (!config) return false
    
    config.permissions = config.permissions.filter(p => p !== permission)
    return true
  }
  
  // ===== COMMANDES IA =====
  
  private aiCommands: Map<string, Map<string, AICommand>> = new Map()
  
  private registerAICommands(pluginId: string, commands: AICommand[]): void {
    if (!this.aiCommands.has(pluginId)) {
      this.aiCommands.set(pluginId, new Map())
    }
    
    const pluginCommands = this.aiCommands.get(pluginId)!
    for (const command of commands) {
      pluginCommands.set(command.name, command)
    }
  }
  
  private unregisterAICommands(pluginId: string): void {
    this.aiCommands.delete(pluginId)
  }
  
  /**
   * Récupère toutes les commandes IA disponibles
   */
  getAllAICommands(): AICommand[] {
    const commands: AICommand[] = []
    for (const pluginCommands of this.aiCommands.values()) {
      commands.push(...pluginCommands.values())
    }
    return commands
  }
  
  /**
   * Exécute une commande IA
   */
  async executeAICommand(
    commandName: string, 
    args: Record<string, any>
  ): Promise<{ response: string; modifications?: object } | null> {
    for (const [pluginId, pluginCommands] of this.aiCommands) {
      const command = pluginCommands.get(commandName)
      if (command) {
        const context = this.createContext(pluginId)
        return command.execute(args, context)
      }
    }
    return null
  }
  
  // ===== VALIDATION =====
  
  private validatePlugin(plugin: Plugin): { 
    valid: boolean
    error?: string
    warnings?: string[] 
  } {
    const warnings: string[] = []
    
    // Vérifier les métadonnées requises
    if (!plugin.metadata?.id) {
      return { valid: false, error: 'ID de plugin manquant' }
    }
    if (!plugin.metadata?.name) {
      return { valid: false, error: 'Nom de plugin manquant' }
    }
    if (!plugin.metadata?.version) {
      return { valid: false, error: 'Version de plugin manquante' }
    }
    
    // Vérifier le format de l'ID
    if (!/^[a-z0-9-]+$/.test(plugin.metadata.id)) {
      return { valid: false, error: 'ID de plugin invalide (utilisez a-z, 0-9, -)' }
    }
    
    // Avertissements
    if (!plugin.metadata.description) {
      warnings.push('Description manquante')
    }
    if (!plugin.metadata.author) {
      warnings.push('Auteur non spécifié')
    }
    
    return { valid: true, warnings }
  }
  
  // ===== GETTERS =====
  
  /**
   * Récupère tous les plugins installés
   */
  getAllPlugins(): PluginState[] {
    return [...store.states.values()]
  }
  
  /**
   * Récupère les plugins actifs
   */
  getEnabledPlugins(): PluginState[] {
    return [...store.states.values()].filter(s => s.status === 'enabled')
  }
  
  /**
   * Récupère un plugin par ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return store.plugins.get(pluginId)
  }
  
  /**
   * Récupère l'état d'un plugin
   */
  getPluginState(pluginId: string): PluginState | undefined {
    return store.states.get(pluginId)
  }
  
  /**
   * Récupère tous les widgets des plugins actifs
   */
  getAllWidgets(): CustomWidget[] {
    const widgets: CustomWidget[] = []
    
    for (const [pluginId, state] of store.states) {
      if (state.status === 'enabled') {
        const plugin = store.plugins.get(pluginId)
        if (plugin?.widgets) {
          widgets.push(...plugin.widgets)
        }
      }
    }
    
    return widgets
  }
  
  /**
   * Récupère toutes les sources de données des plugins actifs
   */
  getAllDataSources(): DataSource[] {
    const sources: DataSource[] = []
    
    for (const [pluginId, state] of store.states) {
      if (state.status === 'enabled') {
        const plugin = store.plugins.get(pluginId)
        if (plugin?.dataSources) {
          sources.push(...plugin.dataSources)
        }
      }
    }
    
    return sources
  }
  
  /**
   * Récupère tous les thèmes des plugins actifs
   */
  getAllThemes(): CustomTheme[] {
    const themes: CustomTheme[] = []
    
    for (const [pluginId, state] of store.states) {
      if (state.status === 'enabled') {
        const plugin = store.plugins.get(pluginId)
        if (plugin?.themes) {
          themes.push(...plugin.themes)
        }
      }
    }
    
    return themes
  }
}

// Export du singleton
export const pluginManager = PluginManager.getInstance()

export default PluginManager

