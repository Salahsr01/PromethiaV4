/**
 * Types pour le Dashboard Dynamique
 */

// Types de widgets disponibles
export type WidgetType = 
  | 'line-chart'      // Courbe (comme burnrate actuel)
  | 'area-chart'      // Aire remplie
  | 'bar-chart'       // Barres verticales
  | 'horizontal-bar'  // Barres horizontales
  | 'pie-chart'       // Camembert
  | 'donut-chart'     // Donut
  | 'gauge'           // Jauge
  | 'kpi'             // KPI simple (chiffre + variation)
  | 'table'           // Tableau de données
  | 'progress'        // Barre de progression
  | 'heatmap'         // Carte de chaleur
  | 'scatter'         // Nuage de points
  | 'radar'           // Radar
  | 'treemap'         // Treemap
  | 'mini-chat'       // Chat IA (comme actuellement)

// Catégories de données
export type DataCategory = 
  | 'burnrate'        // Dépenses mensuelles
  | 'spending'        // Répartition des dépenses
  | 'stock'           // Niveaux de stock
  | 'sales'           // Ventes
  | 'revenue'         // Revenus
  | 'clients'         // Clients
  | 'employees'       // Employés
  | 'projects'        // Projets
  | 'tasks'           // Tâches
  | 'custom'          // Données personnalisées

// Configuration d'un widget
export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  dataCategory: DataCategory
  
  // Position et taille dans la grille
  position: {
    x: number      // Colonne (0-11 pour grille 12 colonnes)
    y: number      // Ligne
    width: number  // Largeur en colonnes (1-12)
    height: number // Hauteur en unités
  }
  
  // Configuration spécifique au type
  config: {
    // Couleurs
    primaryColor?: string
    secondaryColor?: string
    colors?: string[]
    
    // Options de graphique
    showLegend?: boolean
    showGrid?: boolean
    showLabels?: boolean
    showValues?: boolean
    animated?: boolean
    
    // Données
    data?: Array<Record<string, unknown>>
    dataKey?: string
    nameKey?: string
    valueKey?: string
    
    // Pour les KPI
    value?: number
    previousValue?: number
    unit?: string
    format?: 'number' | 'currency' | 'percent'
    
    // Pour les jauges
    min?: number
    max?: number
    thresholds?: Array<{ value: number; color: string }>
    
    // Pour les tableaux
    columns?: Array<{ key: string; label: string; width?: number }>
    sortable?: boolean
    filterable?: boolean
  }
  
  // Métadonnées
  createdAt: Date
  updatedAt: Date
  createdBy: 'user' | 'ai'
}

// Layout du dashboard
export interface DashboardLayout {
  id: string
  name: string
  description?: string
  widgets: WidgetConfig[]
  gridColumns: number  // Nombre de colonnes (défaut: 12)
  gridGap: number      // Espace entre widgets en pixels
  createdAt: Date
  updatedAt: Date
}

// Actions possibles par l'IA
export type DashboardAction = 
  | { type: 'ADD_WIDGET'; widget: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'REMOVE_WIDGET'; widgetId: string }
  | { type: 'UPDATE_WIDGET'; widgetId: string; updates: Partial<WidgetConfig> }
  | { type: 'MOVE_WIDGET'; widgetId: string; position: WidgetConfig['position'] }
  | { type: 'RESIZE_WIDGET'; widgetId: string; size: { width: number; height: number } }
  | { type: 'CHANGE_WIDGET_TYPE'; widgetId: string; newType: WidgetType }
  | { type: 'DUPLICATE_WIDGET'; widgetId: string }
  | { type: 'CLEAR_DASHBOARD' }
  | { type: 'LOAD_TEMPLATE'; templateId: string }
  | { type: 'SAVE_LAYOUT'; name: string }

// Réponse de l'agent IA pour le dashboard builder
export interface DashboardAgentResponse {
  message: string
  actions: DashboardAction[]
  suggestions?: {
    widgetType: WidgetType
    reason: string
  }[]
}

// Templates de dashboard prédéfinis
export interface DashboardTemplate {
  id: string
  name: string
  description: string
  thumbnail?: string
  layout: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>
}

// Données de stock (exemple)
export interface StockData {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  lastUpdated: Date
  status: 'ok' | 'low' | 'critical' | 'overstock'
}

// Données de ventes (exemple)
export interface SalesData {
  date: string
  amount: number
  quantity: number
  product: string
  category: string
  client: string
}

