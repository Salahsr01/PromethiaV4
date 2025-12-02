'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Message, ConversationParticipant } from '../lib/database.types'

interface Collaborator {
  id: string
  name: string
  email: string
  isOnline: boolean
  lastSeenAt: Date
}

interface CollaborationMessage {
  id: string
  userId: string | null
  userName: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface UseCollaborationOptions {
  conversationId: string | null
  userId: string | null
  userName: string
  onNewMessage?: (message: CollaborationMessage) => void
  onParticipantChange?: (participants: Collaborator[]) => void
}

export function useCollaboration({
  conversationId,
  userId,
  userName,
  onNewMessage,
  onParticipantChange
}: UseCollaborationOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<Collaborator[]>([])
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({})
  const channelRef = useRef<RealtimeChannel | null>(null)
  const presenceChannelRef = useRef<RealtimeChannel | null>(null)

  // Rejoindre la conversation collaborative
  const joinConversation = useCallback(async () => {
    if (!conversationId || !userId) return

    try {
      // Ajouter l'utilisateur comme participant
      await supabase
        .from('conversation_participants')
        .upsert({
          conversation_id: conversationId,
          user_id: userId,
          is_online: true,
          last_seen_at: new Date().toISOString()
        } as any)

      // S'abonner aux nouveaux messages
      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            const newMessage = payload.new as Message
            
            // Récupérer le nom de l'utilisateur
            let messageUserName = 'Assistant'
            if (newMessage.user_id) {
              const { data: user } = await supabase
                .from('users')
                .select('name')
                .eq('id', newMessage.user_id)
                .single()
              messageUserName = (user as any)?.name || 'Utilisateur'
            }

            onNewMessage?.({
              id: newMessage.id,
              userId: newMessage.user_id,
              userName: messageUserName,
              role: newMessage.role as 'user' | 'assistant',
              content: newMessage.content,
              createdAt: new Date(newMessage.created_at)
            })
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED')
        })

      channelRef.current = channel

      // Canal de présence pour voir qui est en ligne
      const presenceChannel = supabase
        .channel(`presence:${conversationId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState()
          const onlineUsers: Collaborator[] = []
          
          Object.values(state).forEach((presences: unknown[]) => {
            presences.forEach((presence: unknown) => {
              const p = presence as { id: string; name: string; email: string }
              if (p.id !== userId) {
                onlineUsers.push({
                  id: p.id,
                  name: p.name,
                  email: p.email,
                  isOnline: true,
                  lastSeenAt: new Date()
                })
              }
            })
          })
          
          setParticipants(onlineUsers)
          onParticipantChange?.(onlineUsers)
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('Nouvel utilisateur:', newPresences)
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log('Utilisateur parti:', leftPresences)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              id: userId,
              name: userName,
              online_at: new Date().toISOString()
            })
          }
        })

      presenceChannelRef.current = presenceChannel

    } catch (error) {
      console.error('Erreur connexion collaboration:', error)
    }
  }, [conversationId, userId, userName, onNewMessage, onParticipantChange])

  // Quitter la conversation
  const leaveConversation = useCallback(async () => {
    if (!conversationId || !userId) return

    try {
      // Mettre à jour le statut hors ligne
      const updatePayload: any = {
        is_online: false,
        last_seen_at: new Date().toISOString()
      }
      await (supabase as any)
        .from('conversation_participants')
        .update(updatePayload)
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)

      // Se désabonner des canaux
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (presenceChannelRef.current) {
        await supabase.removeChannel(presenceChannelRef.current)
        presenceChannelRef.current = null
      }

      setIsConnected(false)
      setParticipants([])
    } catch (error) {
      console.error('Erreur déconnexion collaboration:', error)
    }
  }, [conversationId, userId])

  // Envoyer un message collaboratif
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!conversationId || !userId) return false

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: 'user',
          content
        } as any)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur envoi message:', error)
      return false
    }
  }, [conversationId, userId])

  // Indiquer que l'utilisateur tape
  const setTyping = useCallback((typing: boolean) => {
    if (!presenceChannelRef.current || !userId) return

    presenceChannelRef.current.track({
      id: userId,
      name: userName,
      typing,
      online_at: new Date().toISOString()
    })
  }, [userId, userName])

  // Nettoyage à la déconnexion
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    participants,
    isTyping,
    joinConversation,
    leaveConversation,
    sendMessage,
    setTyping
  }
}

