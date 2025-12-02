'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { 
  WidgetConfig, 
  DashboardLayout, 
  DashboardAction, 
  WidgetType,
  DataCategory 
} from '../types/dashboard'

// Données de démonstration
const DEMO_DATA = {
  burnrate: [
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
    { month: "Oct2", value: 22000 },
  ],
  spending: [
    { name: "Equipment", value: 35, color: "#eab308" },
    { name: "Rent", value: 24, color: "#a855f7" },
    { name: "Travel", value: 22, color: "#06b6d4" },
    { name: "Salary", value: 20, color: "#22c55e" },
    { name: "Software", value: 15, color: "#3b82f6" },
    { name: "Other", value: 10, color: "#6b7280" },
  ],
  stock: [
    { name: "Ordinateurs", current: 45, min: 20, max: 100, status: "ok" },
    { name: "Écrans", current: 12, min: 15, max: 50, status: "low" },
    { name: "Claviers", current: 8, min: 10, max: 40, status: "critical" },
    { name: "Souris", current: 67, min: 20, max: 60, status: "overstock" },
    { name: "Câbles HDMI", current: 34, min: 25, max: 80, status: "ok" },
    { name: "Webcams", current: 5, min: 10, max: 30, status: "critical" },
  ],
  sales: [
    { month: "Jan", value: 45000, quantity: 120 },
    { month: "Feb", value: 52000, quantity: 145 },
    { month: "Mar", value: 48000, quantity: 130 },
    { month: "Apr", value: 61000, quantity: 168 },
    { month: "May", value: 55000, quantity: 152 },
    { month: "Jun", value: 67000, quantity: 189 },
  ],
  kpis: {
    revenue: { value: 328000, previous: 295000, unit: "€" },
    clients: { value: 1247, previous: 1180, unit: "" },
    satisfaction: { value: 94.5, previous: 92.1, unit: "%" },
    projects: { value: 23, previous: 19, unit: "" },
  }
}

// Layout par défaut (similaire à l'actuel)
const defaultLayout: DashboardLayout = {
  id: 'default',
  name: 'Dashboard Principal',
  description: 'Vue par défaut du tableau de bord',
  gridColumns: 12,
  gridGap: 16,
  widgets: [
    {
      id: 'burnrate-main',
      type: 'area-chart',
      title: 'Burnrate',
      dataCategory: 'burnrate',
      position: { x: 0, y: 0, width: 12, height: 2 },
      config: {
        primaryColor: '#ffffff',
        data: DEMO_DATA.burnrate,
        dataKey: 'value',
        nameKey: 'month',
        showGrid: true,
        showLabels: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
    },
    {
      id: 'mini-chat',
      type: 'mini-chat',
      title: 'Assistance IA',
      dataCategory: 'custom',
      position: { x: 0, y: 2, width: 5, height: 2 },
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
    },
    {
      id: 'tracker',
      type: 'progress',
      title: 'Tracker',
      dataCategory: 'tasks',
      position: { x: 5, y: 2, width: 3, height: 2 },
      config: {
        value: 65,
        primaryColor: '#3b82f6',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
    },
    {
      id: 'spending',
      type: 'pie-chart',
      title: 'Spending',
      dataCategory: 'spending',
      position: { x: 8, y: 2, width: 4, height: 2 },
      config: {
        data: DEMO_DATA.spending,
        dataKey: 'value',
        nameKey: 'name',
        showLegend: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Context
interface DynamicDashboardContextType {
  layout: DashboardLayout
  widgets: WidgetConfig[]
  selectedWidgetId: string | null
  
  // Actions
  dispatch: (action: DashboardAction) => void
  selectWidget: (id: string | null) => void
  
  // Helpers
  getWidgetById: (id: string) => WidgetConfig | undefined
  getDataForCategory: (category: DataCategory) => unknown
  getSuggestedWidgetTypes: (category: DataCategory) => WidgetType[]
  
  // État
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
}

const DynamicDashboardContext = createContext<DynamicDashboardContextType | undefined>(undefined)

// Générateur d'ID unique
const generateId = () => `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export function DynamicDashboardProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<DashboardLayout>(defaultLayout)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Dispatcher d'actions
  const dispatch = useCallback((action: DashboardAction) => {
    setLayout(prev => {
      const now = new Date()
      
      switch (action.type) {
        case 'ADD_WIDGET': {
          const newWidget: WidgetConfig = {
            ...action.widget,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
          }
          return {
            ...prev,
            widgets: [...prev.widgets, newWidget],
            updatedAt: now,
          }
        }
        
        case 'REMOVE_WIDGET': {
          return {
            ...prev,
            widgets: prev.widgets.filter(w => w.id !== action.widgetId),
            updatedAt: now,
          }
        }
        
        case 'UPDATE_WIDGET': {
          return {
            ...prev,
            widgets: prev.widgets.map(w => 
              w.id === action.widgetId 
                ? { ...w, ...action.updates, updatedAt: now }
                : w
            ),
            updatedAt: now,
          }
        }
        
        case 'MOVE_WIDGET': {
          return {
            ...prev,
            widgets: prev.widgets.map(w =>
              w.id === action.widgetId
                ? { ...w, position: action.position, updatedAt: now }
                : w
            ),
            updatedAt: now,
          }
        }
        
        case 'RESIZE_WIDGET': {
          return {
            ...prev,
            widgets: prev.widgets.map(w =>
              w.id === action.widgetId
                ? { 
                    ...w, 
                    position: { ...w.position, ...action.size },
                    updatedAt: now 
                  }
                : w
            ),
            updatedAt: now,
          }
        }
        
        case 'CHANGE_WIDGET_TYPE': {
          return {
            ...prev,
            widgets: prev.widgets.map(w =>
              w.id === action.widgetId
                ? { ...w, type: action.newType, updatedAt: now }
                : w
            ),
            updatedAt: now,
          }
        }
        
        case 'DUPLICATE_WIDGET': {
          const original = prev.widgets.find(w => w.id === action.widgetId)
          if (!original) return prev
          
          const duplicate: WidgetConfig = {
            ...original,
            id: generateId(),
            title: `${original.title} (copie)`,
            position: {
              ...original.position,
              y: original.position.y + original.position.height,
            },
            createdAt: now,
            updatedAt: now,
          }
          
          return {
            ...prev,
            widgets: [...prev.widgets, duplicate],
            updatedAt: now,
          }
        }
        
        case 'CLEAR_DASHBOARD': {
          return {
            ...prev,
            widgets: [],
            updatedAt: now,
          }
        }
        
        default:
          return prev
      }
    })
  }, [])

  // Helpers
  const getWidgetById = useCallback((id: string) => {
    return layout.widgets.find(w => w.id === id)
  }, [layout.widgets])

  const getDataForCategory = useCallback((category: DataCategory) => {
    switch (category) {
      case 'burnrate': return DEMO_DATA.burnrate
      case 'spending': return DEMO_DATA.spending
      case 'stock': return DEMO_DATA.stock
      case 'sales': return DEMO_DATA.sales
      default: return null
    }
  }, [])

  const getSuggestedWidgetTypes = useCallback((category: DataCategory): WidgetType[] => {
    switch (category) {
      case 'burnrate':
      case 'sales':
        return ['line-chart', 'area-chart', 'bar-chart']
      case 'spending':
        return ['pie-chart', 'donut-chart', 'horizontal-bar', 'treemap']
      case 'stock':
        return ['bar-chart', 'horizontal-bar', 'table', 'gauge']
      case 'clients':
      case 'employees':
        return ['kpi', 'bar-chart', 'table']
      case 'tasks':
      case 'projects':
        return ['progress', 'kpi', 'table']
      default:
        return ['bar-chart', 'line-chart', 'table', 'kpi']
    }
  }, [])

  return (
    <DynamicDashboardContext.Provider
      value={{
        layout,
        widgets: layout.widgets,
        selectedWidgetId,
        dispatch,
        selectWidget: setSelectedWidgetId,
        getWidgetById,
        getDataForCategory,
        getSuggestedWidgetTypes,
        isEditing,
        setIsEditing,
      }}
    >
      {children}
    </DynamicDashboardContext.Provider>
  )
}

export function useDynamicDashboard() {
  const context = useContext(DynamicDashboardContext)
  if (context === undefined) {
    throw new Error('useDynamicDashboard must be used within a DynamicDashboardProvider')
  }
  return context
}

