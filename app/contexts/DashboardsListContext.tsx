'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface DashboardWidget {
  type: 'chart' | 'kpi' | 'table' | 'calendar' | 'progress'
  title: string
  description: string
}

export interface DashboardItem {
  id: string
  name: string
  description: string
  createdAt: Date
  isDefault?: boolean
  widgets?: DashboardWidget[]
}

interface DashboardsListContextType {
  dashboards: DashboardItem[]
  isLoading: boolean
  addDashboard: (name: string, description: string, widgets?: DashboardWidget[]) => Promise<DashboardItem>
  removeDashboard: (id: string) => Promise<void>
  getDashboard: (id: string) => DashboardItem | undefined
  refreshDashboards: () => Promise<void>
}

const DashboardsListContext = createContext<DashboardsListContextType | undefined>(undefined)

// ID utilisateur par défaut (Salah)
const DEFAULT_USER_ID = '917d42e9-8d08-45af-af7f-53c2ef5a7481'

export function DashboardsListProvider({ children }: { children: ReactNode }) {
  const [dashboards, setDashboards] = useState<DashboardItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Charger les dashboards depuis Supabase
  const refreshDashboards = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('owner_id', DEFAULT_USER_ID)
        .order('created_at', { ascending: true })

      if (error) throw error

      const mapped: DashboardItem[] = (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        createdAt: new Date(d.created_at),
        isDefault: d.is_default,
        widgets: (d.widgets as DashboardWidget[]) || []
      }))

      setDashboards(mapped)
    } catch (error) {
      console.error('Erreur chargement dashboards:', error)
      // Fallback sur localStorage si Supabase échoue
      const saved = localStorage.getItem('promethia-dashboards')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setDashboards(parsed.map((d: DashboardItem) => ({
            ...d,
            createdAt: new Date(d.createdAt)
          })))
        } catch (e) {
          console.error('Erreur parsing localStorage:', e)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Charger au montage
  useEffect(() => {
    refreshDashboards()
  }, [refreshDashboards])

  // Sauvegarder aussi dans localStorage comme backup
  useEffect(() => {
    if (dashboards.length > 0) {
      localStorage.setItem('promethia-dashboards', JSON.stringify(dashboards))
    }
  }, [dashboards])

  const addDashboard = async (name: string, description: string, widgets?: DashboardWidget[]): Promise<DashboardItem> => {
    try {
      const { data, error } = await supabase
        .from('dashboards')
        .insert({
          name,
          description,
          owner_id: DEFAULT_USER_ID,
          is_default: false,
          widgets: (widgets || []) as unknown as Record<string, unknown>[]
        } as any)
        .select()
        .single()

      if (error) throw error

      const newDashboard: DashboardItem = {
        id: (data as any).id,
        name: (data as any).name,
        description: (data as any).description,
        createdAt: new Date((data as any).created_at),
        isDefault: false,
        widgets: ((data as any).widgets as DashboardWidget[]) || []
      }

      setDashboards(prev => [...prev, newDashboard])
      return newDashboard
    } catch (error) {
      console.error('Erreur création dashboard:', error)
      // Fallback local
      const localDashboard: DashboardItem = {
        id: `local-${Date.now()}`,
        name,
        description,
        createdAt: new Date(),
        isDefault: false,
        widgets: widgets || []
      }
      setDashboards(prev => [...prev, localDashboard])
      return localDashboard
    }
  }

  const removeDashboard = async (id: string) => {
    // Ne pas supprimer les dashboards par défaut
    const dashboard = dashboards.find(d => d.id === id)
    if (dashboard?.isDefault) return

    try {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erreur suppression dashboard:', error)
    }

    setDashboards(prev => prev.filter(d => d.id !== id))
  }

  const getDashboard = (id: string) => {
    return dashboards.find(d => d.id === id)
  }

  return (
    <DashboardsListContext.Provider
      value={{
        dashboards,
        isLoading,
        addDashboard,
        removeDashboard,
        getDashboard,
        refreshDashboards
      }}
    >
      {children}
    </DashboardsListContext.Provider>
  )
}

export function useDashboardsList() {
  const context = useContext(DashboardsListContext)
  if (context === undefined) {
    throw new Error('useDashboardsList must be used within a DashboardsListProvider')
  }
  return context
}

