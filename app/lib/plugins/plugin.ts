/**
 * Types pour le système de plugins
 */

// Métadonnées d'un plugin
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  repository?: string
  license?: string
  keywords?: string[]
  icon?: string
  category?: 'data' | 'visualization' | 'integration' | 'ai' | 'theme' | 'utility'
}

// Configuration d'un plugin
export interface PluginConfig {
  enabled: boolean
  settings: Record<string, any>
  permissions: PluginPermission[]
}

// Permissions disponibles
export type PluginPermission = 
  | 'read:data'           // Lire les données
  | 'write:data'          // Modifier les données
  | 'read:config'         // Lire la configuration
  | 'write:config'        // Modifier la configuration
  | 'network:outbound'    // Requêtes réseau sortantes
  | 'storage:local'       // Stockage local
  | 'ui:modify'           // Modifier l'interface
  | 'ai:extend'           // Étendre les capacités IA
  | 'notifications'       // Envoyer des notifications

// Contexte fourni aux plugins
export interface PluginContext {
  // Données
  getData: (seriesId: string) => Promise<any[]>
  setData: (seriesId: string, data: any[]) => Promise<void>
  
  // Configuration
  getConfig: () => PluginConfig
  setConfig: (config: Partial<PluginConfig['settings']>) => Promise<void>
  
  // UI
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  showModal: (options: { title: string; content: React.ReactNode }) => void
  
  // IA
  extendAI: (commands: AICommand[]) => void
  
  // Événements
  on: (event: PluginEvent, handler: (...args: any[]) => void) => void
  off: (event: PluginEvent, handler: (...args: any[]) => void) => void
  emit: (event: PluginEvent, ...args: any[]) => void
  
  // Stockage
  storage: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
    delete: (key: string) => Promise<void>
  }
  
  // Réseau
  fetch: (url: string, options?: RequestInit) => Promise<Response>
  
  // Logging
  log: {
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
  }
}

// Événements plugin
export type PluginEvent = 
  | 'data:changed'
  | 'config:changed'
  | 'chart:modified'
  | 'message:received'
  | 'message:sent'
  | 'session:start'
  | 'session:end'

// Commande IA personnalisée
export interface AICommand {
  name: string
  description: string
  parameters?: {
    name: string
    type: 'string' | 'number' | 'boolean' | 'array'
    description: string
    required?: boolean
  }[]
  execute: (args: Record<string, any>, context: PluginContext) => Promise<{
    response: string
    modifications?: object
  }>
}

// Widget personnalisé
export interface CustomWidget {
  id: string
  name: string
  description?: string
  defaultSize: { width: number; height: number }
  minSize?: { width: number; height: number }
  maxSize?: { width: number; height: number }
  render: (props: { data: any; config: any; context: PluginContext }) => React.ReactNode
  configPanel?: (props: { config: any; onChange: (config: any) => void }) => React.ReactNode
}

// Source de données personnalisée
export interface DataSource {
  id: string
  name: string
  description?: string
  icon?: string
  configSchema: {
    fields: {
      name: string
      type: 'string' | 'number' | 'boolean' | 'select' | 'password'
      label: string
      required?: boolean
      options?: { value: string; label: string }[]
    }[]
  }
  connect: (config: Record<string, any>) => Promise<void>
  disconnect: () => Promise<void>
  fetch: (query?: string) => Promise<any[]>
  subscribe?: (callback: (data: any[]) => void) => () => void
}

// Thème personnalisé
export interface CustomTheme {
  id: string
  name: string
  description?: string
  preview?: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    success: string
    warning: string
    error: string
    chart: string[]
  }
  fonts?: {
    heading?: string
    body?: string
    mono?: string
  }
  borderRadius?: string
  shadows?: {
    sm: string
    md: string
    lg: string
  }
}

// Interface principale d'un plugin
export interface Plugin {
  metadata: PluginMetadata
  
  // Lifecycle
  onLoad?: (context: PluginContext) => Promise<void>
  onUnload?: () => Promise<void>
  onEnable?: (context: PluginContext) => Promise<void>
  onDisable?: () => Promise<void>
  
  // Extensions
  commands?: AICommand[]
  widgets?: CustomWidget[]
  dataSources?: DataSource[]
  themes?: CustomTheme[]
  
  // Hooks
  hooks?: {
    beforeMessage?: (message: string) => string | Promise<string>
    afterMessage?: (message: string, response: string) => void | Promise<void>
    beforeModification?: (modification: object) => object | Promise<object>
    afterModification?: (modification: object) => void | Promise<void>
  }
  
  // Configuration UI
  settingsPanel?: (props: { 
    config: PluginConfig['settings']
    onChange: (config: PluginConfig['settings']) => void 
  }) => React.ReactNode
}

// État d'un plugin
export interface PluginState {
  id: string
  metadata: PluginMetadata
  config: PluginConfig
  status: 'installed' | 'enabled' | 'disabled' | 'error'
  error?: string
  loadedAt?: Date
}

// Résultat d'installation
export interface InstallResult {
  success: boolean
  pluginId?: string
  error?: string
  warnings?: string[]
}

// Manifest de plugin (pour les plugins externes)
export interface PluginManifest {
  metadata: PluginMetadata
  permissions: PluginPermission[]
  entryPoint: string
  dependencies?: Record<string, string>
}

