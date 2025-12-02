'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Types
export interface Collaborator {
  id: string
  name: string
  email?: string
  avatarUrl?: string
  isOnline: boolean
  isTyping: boolean
  color: string
  lastSeenAt: Date
}

export interface CollaborativeMessage {
  id: string
  visitorId: string
  visitorName: string
  visitorColor: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  isAIResponse?: boolean
}

interface CollaborationContextType {
  // État
  isCollabActive: boolean
  visitorId: string
  visitorName: string
  collaborators: Collaborator[]
  typingUsers: string[]
  inviteCode: string | null
  isConnected: boolean
  messages: CollaborativeMessage[]
  isAITyping: boolean
  
  // Actions
  startCollaboration: () => Promise<string>
  joinCollaboration: (code: string) => Promise<boolean>
  leaveCollaboration: () => Promise<void>
  toggleCollaboration: () => void
  setTyping: (isTyping: boolean) => void
  sendCollabMessage: (content: string) => Promise<boolean>
  broadcastAIResponse: (content: string) => Promise<boolean>
  setAITyping: (isTyping: boolean) => void
  generateInviteLink: () => string
  setVisitorName: (name: string) => void
}

const CollaborationContext = createContext<CollaborationContextType | null>(null)

// Couleurs pour les collaborateurs
const COLLABORATOR_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

// Générer un code d'invitation unique
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Générer un ID visiteur unique
function generateVisitorId(): string {
  if (typeof window !== 'undefined') {
    let id = localStorage.getItem('promethia-visitor-id')
    if (!id) {
      id = `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('promethia-visitor-id', id)
    }
    return id
  }
  return `visitor-${Date.now()}`
}

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const [isCollabActive, setIsCollabActive] = useState(false)
  const [visitorId] = useState(() => generateVisitorId())
  const [visitorName, setVisitorName] = useState('Visiteur')
  const [visitorColor] = useState(() => COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<CollaborativeMessage[]>([])
  const [isAITyping, setIsAITyping] = useState(false)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Charger le nom depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('promethia-visitor-name')
      if (savedName) {
        setVisitorName(savedName)
      } else {
        // Nom par défaut
        setVisitorName('Salah-Eddine Sriar')
        localStorage.setItem('promethia-visitor-name', 'Salah-Eddine Sriar')
      }
    }
  }, [])

  // Sauvegarder le nom
  const handleSetVisitorName = useCallback((name: string) => {
    setVisitorName(name)
    if (typeof window !== 'undefined') {
      localStorage.setItem('promethia-visitor-name', name)
    }
  }, [])

  // Démarrer une nouvelle session collaborative
  const startCollaboration = useCallback(async (): Promise<string> => {
    const code = generateInviteCode()
    setInviteCode(code)
    setIsCollabActive(true)
    setMessages([])
    return code
  }, [])

  // Rejoindre une session collaborative - UTILISE LE CODE DIRECTEMENT
  const joinCollaboration = useCallback(async (code: string): Promise<boolean> => {
    try {
      const upperCode = code.toUpperCase().trim()
      if (upperCode.length !== 6) {
        return false
      }
      
      setInviteCode(upperCode)
      setIsCollabActive(true)
      setMessages([])
      return true
    } catch (e) {
      console.error('Erreur rejoindre collaboration:', e)
      return false
    }
  }, [])

  // Quitter la collaboration
  const leaveCollaboration = useCallback(async () => {
    if (channelRef.current) {
      // Notifier les autres qu'on part
      channelRef.current.send({
        type: 'broadcast',
        event: 'user_left',
        payload: { visitorId, visitorName }
      })
      await supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    setIsCollabActive(false)
    setInviteCode(null)
    setCollaborators([])
    setTypingUsers([])
    setIsConnected(false)
    setMessages([])
  }, [visitorId, visitorName])

  // Toggle collaboration
  const toggleCollaboration = useCallback(() => {
    if (isCollabActive) {
      leaveCollaboration()
    } else {
      startCollaboration()
    }
  }, [isCollabActive, leaveCollaboration, startCollaboration])

  // Indiquer que l'utilisateur tape
  const setTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current) return
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        visitorId,
        visitorName,
        typing: isTyping
      }
    })

    // Auto-reset après 3 secondes
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            visitorId,
            visitorName,
            typing: false
          }
        })
      }, 3000)
    }
  }, [visitorId, visitorName])

  // Envoyer un message collaboratif
  const sendCollabMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!channelRef.current || !inviteCode) {
      console.log('❌ Canal non prêt:', { channel: !!channelRef.current, inviteCode })
      return false
    }
    
    const message: CollaborativeMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      visitorId,
      visitorName,
      visitorColor,
      role: 'user',
      content,
      createdAt: new Date()
    }
    
    // Ajouter localement
    setMessages(prev => [...prev, message])
    
    // Broadcast aux autres
    console.log('📤 Envoi message:', message.content.substring(0, 50))
    const result = await channelRef.current.send({
      type: 'broadcast',
      event: 'new_message',
      payload: message
    })
    console.log('📤 Résultat envoi:', result)
    
    return true
  }, [inviteCode, visitorId, visitorName, visitorColor])

  // Indiquer que l'IA est en train de répondre
  const setAITyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current) return
    
    setIsAITyping(isTyping)
    
    // Broadcaster l'état à tous
    channelRef.current.send({
      type: 'broadcast',
      event: 'ai_typing',
      payload: { typing: isTyping }
    })
  }, [])

  // Broadcaster une réponse de l'IA à tous les participants
  const broadcastAIResponse = useCallback(async (content: string): Promise<boolean> => {
    if (!channelRef.current || !inviteCode) {
      console.log('❌ Canal non prêt pour IA:', { channel: !!channelRef.current, inviteCode })
      return false
    }
    
    // Arrêter l'animation de frappe
    setIsAITyping(false)
    channelRef.current.send({
      type: 'broadcast',
      event: 'ai_typing',
      payload: { typing: false }
    })
    
    const message: CollaborativeMessage = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      visitorId: 'ai-assistant',
      visitorName: 'Assistant IA',
      visitorColor: '#1438BB',
      role: 'assistant',
      content,
      createdAt: new Date(),
      isAIResponse: true
    }
    
    // Ajouter localement
    setMessages(prev => [...prev, message])
    
    // Broadcast aux autres
    console.log('🤖 Broadcast réponse IA:', content.substring(0, 50))
    const result = await channelRef.current.send({
      type: 'broadcast',
      event: 'ai_response',
      payload: message
    })
    console.log('🤖 Résultat broadcast IA:', result)
    
    return true
  }, [inviteCode])

  // Générer le lien d'invitation
  const generateInviteLink = useCallback((): string => {
    if (!inviteCode) return ''
    if (typeof window !== 'undefined') {
      // Utiliser l'IP réseau si disponible
      const baseUrl = window.location.origin
      return `${baseUrl}?join=${inviteCode}`
    }
    return ''
  }, [inviteCode])

  // Configurer le canal Supabase Realtime quand la collab est active
  useEffect(() => {
    if (!isCollabActive || !inviteCode) return

    console.log('🔗 Connexion au canal:', inviteCode)

    // Canal unique basé sur le code d'invitation
    const channel = supabase
      .channel(`collab-room-${inviteCode}`, {
        config: {
          broadcast: { ack: true }, // Recevoir confirmation d'envoi
          presence: { key: visitorId }
        }
      })
      // Nouveaux messages utilisateurs
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        console.log('📩 Message reçu de:', payload.visitorName, '| Contenu:', payload.content?.substring(0, 30))
        const msg = payload as CollaborativeMessage
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) {
            console.log('⚠️ Message déjà présent, ignoré')
            return prev
          }
          console.log('✅ Message ajouté à la liste')
          return [...prev, { ...msg, createdAt: new Date(msg.createdAt) }]
        })
      })
      // Réponses de l'IA (synchronisées entre tous)
      .on('broadcast', { event: 'ai_response' }, ({ payload }) => {
        console.log('🤖 Réponse IA reçue:', payload.content?.substring(0, 50))
        const msg = payload as CollaborativeMessage
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) {
            console.log('⚠️ Réponse IA déjà présente, ignorée')
            return prev
          }
          console.log('✅ Réponse IA ajoutée à la liste')
          return [...prev, { ...msg, createdAt: new Date(msg.createdAt), isAIResponse: true }]
        })
      })
      // Utilisateur en train de taper
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { visitorId: typingVisitorId, visitorName: typingName, typing } = payload
        if (typingVisitorId !== visitorId) {
          setTypingUsers(prev => {
            if (typing && !prev.includes(typingName)) {
              return [...prev, typingName]
            } else if (!typing) {
              return prev.filter(n => n !== typingName)
            }
            return prev
          })
        }
      })
      // IA en train de répondre
      .on('broadcast', { event: 'ai_typing' }, ({ payload }) => {
        console.log('🤖 IA typing:', payload.typing)
        setIsAITyping(payload.typing)
      })
      // Utilisateur parti
      .on('broadcast', { event: 'user_left' }, ({ payload }) => {
        console.log('👋 Utilisateur parti:', payload)
        setCollaborators(prev => prev.filter(c => c.id !== payload.visitorId))
      })
      // Présence (qui est en ligne)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: Collaborator[] = []
        
        let colorIndex = 0
        Object.values(state).forEach((presences) => {
          (presences as unknown as Array<{ visitorId: string; visitorName: string; visitorColor: string }>).forEach((presence) => {
            if (presence.visitorId !== visitorId) {
              users.push({
                id: presence.visitorId,
                name: presence.visitorName,
                isOnline: true,
                isTyping: false,
                color: presence.visitorColor || COLLABORATOR_COLORS[colorIndex % COLLABORATOR_COLORS.length],
                lastSeenAt: new Date()
              })
              colorIndex++
            }
          })
        })
        
        setCollaborators(users)
        console.log('👥 Participants:', users.length + 1)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('✅ Nouveau participant:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('❌ Participant parti:', leftPresences)
      })
      .subscribe(async (status) => {
        console.log('📡 Statut canal:', status)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          // S'annoncer aux autres
          await channel.track({
            visitorId,
            visitorName,
            visitorColor,
            online_at: new Date().toISOString()
          })
        } else {
          setIsConnected(false)
        }
      })

    channelRef.current = channel

    return () => {
      console.log('🔌 Déconnexion du canal')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [isCollabActive, inviteCode, visitorId, visitorName, visitorColor])

  // Vérifier si on rejoint via URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const joinCode = params.get('join')
      if (joinCode && joinCode.length === 6) {
        console.log('🎯 Rejoindre via URL:', joinCode)
        joinCollaboration(joinCode)
        // Nettoyer l'URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [joinCollaboration])

  return (
    <CollaborationContext.Provider value={{
      isCollabActive,
      visitorId,
      visitorName,
      collaborators,
      typingUsers,
      inviteCode,
      isConnected,
      messages,
      isAITyping,
      startCollaboration,
      joinCollaboration,
      leaveCollaboration,
      toggleCollaboration,
      setTyping,
      sendCollabMessage,
      broadcastAIResponse,
      setAITyping,
      generateInviteLink,
      setVisitorName: handleSetVisitorName
    }}>
      {children}
    </CollaborationContext.Provider>
  )
}

export function useCollaborationContext() {
  const context = useContext(CollaborationContext)
  if (!context) {
    throw new Error('useCollaborationContext must be used within CollaborationProvider')
  }
  return context
}
