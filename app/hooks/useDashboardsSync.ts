'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Dashboard } from '../lib/database.types'
import type { DashboardItem, DashboardWidget } from '../contexts/DashboardsListContext'

interface UseDashboardsSyncOptions {
  userId: string | null
  onSyncComplete?: () => void
}

export function useDashboardsSync({ userId, onSyncComplete }: UseDashboardsSyncOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Convertir un dashboard Supabase vers le format local
  const toLocalDashboard = (dashboard: Dashboard): DashboardItem => ({
    id: dashboard.id,
    name: dashboard.name,
    description: dashboard.description,
    createdAt: new Date(dashboard.created_at),
    isDefault: dashboard.is_default,
    widgets: (dashboard.widgets as unknown as DashboardWidget[]) || []
  })

  // Récupérer les dashboards depuis Supabase
  const fetchDashboards = useCallback(async (): Promise<DashboardItem[]> => {
    if (!userId) return []
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Récupérer les dashboards dont l'utilisateur est propriétaire
      const { data: ownedDashboards, error: ownedError } = await supabase
        .from('dashboards')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true })

      if (ownedError) throw ownedError

      // Récupérer les dashboards partagés avec l'utilisateur
      const { data: sharedDashboards, error: sharedError } = await supabase
        .from('dashboard_collaborators')
        .select('dashboard:dashboards(*)')
        .eq('user_id', userId)

      if (sharedError) throw sharedError

      // Combiner les dashboards
      const owned = (ownedDashboards || []).map(toLocalDashboard)
      const shared = (sharedDashboards || [])
        .map((item: any) => item.dashboard as unknown as Dashboard)
        .filter(Boolean)
        .map(toLocalDashboard)

      return [...owned, ...shared]
    } catch (err) {
      setError(err as Error)
      console.error('Erreur fetch dashboards:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Créer un dashboard dans Supabase
  const createDashboard = useCallback(async (
    name: string,
    description: string,
    widgets: DashboardWidget[] = []
  ): Promise<DashboardItem | null> => {
    if (!userId) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('dashboards')
        .insert({
          name,
          description,
          owner_id: userId,
          widgets: widgets as unknown as Record<string, unknown>[],
          is_default: false
        } as any)
        .select()
        .single()

      if (error) throw error

      onSyncComplete?.()
      return toLocalDashboard(data)
    } catch (err) {
      setError(err as Error)
      console.error('Erreur création dashboard:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [userId, onSyncComplete])

  // Mettre à jour un dashboard
  const updateDashboard = useCallback(async (
    id: string,
    updates: Partial<Pick<DashboardItem, 'name' | 'description' | 'widgets'>>
  ): Promise<boolean> => {
    if (!userId) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      const updatePayload: any = {
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.widgets && { widgets: updates.widgets as unknown as Record<string, unknown>[] })
      }
      const { error } = await (supabase as any)
        .from('dashboards')
        .update(updatePayload)
        .eq('id', id)

      if (error) throw error

      onSyncComplete?.()
      return true
    } catch (err) {
      setError(err as Error)
      console.error('Erreur mise à jour dashboard:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId, onSyncComplete])

  // Supprimer un dashboard
  const deleteDashboard = useCallback(async (id: string): Promise<boolean> => {
    if (!userId) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', id)
        .eq('owner_id', userId) // Sécurité: seulement le propriétaire peut supprimer

      if (error) throw error

      onSyncComplete?.()
      return true
    } catch (err) {
      setError(err as Error)
      console.error('Erreur suppression dashboard:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId, onSyncComplete])

  // Inviter un collaborateur
  const inviteCollaborator = useCallback(async (
    dashboardId: string,
    userEmail: string,
    role: 'viewer' | 'editor' | 'admin' = 'viewer'
  ): Promise<boolean> => {
    if (!userId) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Trouver l'utilisateur par email
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (userError || !targetUser) {
        throw new Error('Utilisateur non trouvé')
      }

      // Ajouter le collaborateur
      const { error } = await supabase
        .from('dashboard_collaborators')
        .insert({
          dashboard_id: dashboardId,
          user_id: (targetUser as any).id,
          role,
          invited_by: userId
        } as any)

      if (error) throw error

      onSyncComplete?.()
      return true
    } catch (err) {
      setError(err as Error)
      console.error('Erreur invitation collaborateur:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId, onSyncComplete])

  return {
    isLoading,
    error,
    fetchDashboards,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    inviteCollaborator
  }
}

