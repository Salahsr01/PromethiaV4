'use client'

import React, { useState } from 'react'
import { useCollaborationContext, type Collaborator } from '../contexts/CollaborationContext'
import { X, Copy, Check, Users, Link2, UserPlus, Mail, Send, Loader2 } from 'lucide-react'

interface CollaborationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function CollaborationPanel({ isOpen, onClose }: CollaborationPanelProps) {
  const {
    isCollabActive,
    collaborators,
    inviteCode,
    isConnected,
    visitorName,
    startCollaboration,
    joinCollaboration,
    leaveCollaboration,
    generateInviteLink
  } = useCollaborationContext()

  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')
  
  // Email invitation
  const [inviteEmail, setInviteEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState('')

  const copyToClipboard = async (text: string) => {
    try {
      // Essayer l'API moderne
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback pour HTTP/localhost
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erreur copie:', err)
      // Afficher le texte à copier manuellement
      alert(`Copie manuelle: ${text}`)
    }
  }

  const handleCopyLink = async () => {
    const link = generateInviteLink()
    await copyToClipboard(link)
  }

  const handleCopyCode = async () => {
    if (inviteCode) {
      await copyToClipboard(inviteCode)
    }
  }

  const handleJoin = async () => {
    setJoinError('')
    const success = await joinCollaboration(joinCode)
    if (!success) {
      setJoinError('Code invalide ou session expirée')
    }
  }

  const handleStart = async () => {
    await startCollaboration()
  }

  // Envoyer invitation par email
  const handleSendEmailInvite = async () => {
    if (!inviteEmail || !inviteCode) return
    
    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setEmailError('Email invalide')
      return
    }
    
    setSendingEmail(true)
    setEmailError('')
    setEmailSent(false)
    
    try {
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          inviterName: visitorName,
          inviteCode,
          joinLink: generateInviteLink(),
          conversationTitle: 'une session collaborative'
        })
      })
      
      const data = await response.json()

      if (!response.ok) {
        // Afficher le message d'erreur détaillé
        const errorMsg = data.details || data.error || 'Erreur envoi'
        throw new Error(errorMsg)
      }

      setEmailSent(true)
      setInviteEmail('')
      setTimeout(() => setEmailSent(false), 5000)
    } catch (err) {
      console.error('Erreur envoi email:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur envoi email'
      setEmailError(errorMessage)
    } finally {
      setSendingEmail(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-neutral-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="text-white text-lg font-light">Mode Collaboration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!isCollabActive ? (
            <>
              {/* Tabs */}
              <div className="flex mb-6">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-2 text-sm transition-colors ${
                    activeTab === 'create'
                      ? 'bg-blue-800 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Créer une session
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 py-2 text-sm transition-colors ${
                    activeTab === 'join'
                      ? 'bg-blue-800 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Rejoindre
                </button>
              </div>

              {activeTab === 'create' ? (
                <div className="space-y-4">
                  <p className="text-neutral-400 text-sm">
                    Créez une session collaborative et invitez vos partenaires à rejoindre la conversation en temps réel.
                  </p>
                  <button
                    onClick={handleStart}
                    className="w-full py-3 bg-blue-800 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Démarrer la collaboration
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-neutral-400 text-sm">
                    Entrez le code d&apos;invitation pour rejoindre une session existante.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="CODE"
                      maxLength={6}
                      className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-600 text-white text-center text-lg tracking-widest uppercase placeholder:text-neutral-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleJoin}
                      disabled={joinCode.length !== 6}
                      className="px-6 py-3 bg-blue-800 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Rejoindre
                    </button>
                  </div>
                  {joinError && (
                    <p className="text-red-400 text-xs">{joinError}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Session active */}
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm text-neutral-400">
                    {isConnected ? 'Connecté' : 'Connexion...'}
                  </span>
                </div>

                {/* Invite code */}
                <div className="p-4 bg-neutral-800 border border-neutral-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-neutral-400">Code d&apos;invitation</span>
                    <button
                      onClick={handleCopyCode}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                  <div className="text-3xl font-mono text-white tracking-[0.3em] text-center">
                    {inviteCode}
                  </div>
                </div>

                {/* Share link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  {copied ? 'Lien copié !' : 'Copier le lien d\'invitation'}
                </button>

                {/* Invitation par email */}
                <div className="p-4 bg-neutral-800/50 border border-neutral-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-neutral-300">Inviter par email</span>
                    </div>
                    <div className="group relative">
                      <button className="text-neutral-500 hover:text-neutral-300 text-xs">
                        ℹ️
                      </button>
                      <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-2 bg-neutral-900 border border-neutral-700 text-xs text-neutral-400 z-50 shadow-xl">
                        <p className="mb-1">💡 <strong className="text-neutral-300">Note importante</strong></p>
                        <p>L&apos;envoi d&apos;email nécessite un domaine vérifié dans Resend ou l&apos;ajout de l&apos;email destinataire dans vos emails de test.</p>
                        <p className="mt-1 text-blue-400">Voir RESEND_SETUP.md</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-600 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendEmailInvite}
                      disabled={!inviteEmail || sendingEmail}
                      className="px-4 py-2 bg-blue-800 text-white text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sendingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : emailSent ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {emailSent && (
                    <p className="text-green-400 text-xs mt-2">✓ Invitation envoyée !</p>
                  )}
                  {emailError && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                      <p className="text-red-400 text-xs whitespace-pre-line">{emailError}</p>
                    </div>
                  )}
                </div>

                {/* Participants */}
                <div>
                  <h3 className="text-sm text-neutral-400 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participants ({collaborators.length + 1})
                  </h3>
                  <div className="space-y-2">
                    {/* Current user */}
                    <div className="flex items-center gap-3 p-2 bg-neutral-800/50">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: '#3B82F6' }}
                      >
                        {visitorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white">Vous ({visitorName})</div>
                        <div className="text-[10px] text-green-400 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          En ligne
                        </div>
                      </div>
                    </div>

                    {/* Other participants */}
                    {collaborators.map((collab) => (
                      <CollaboratorItem key={collab.id} collaborator={collab} />
                    ))}

                    {collaborators.length === 0 && (
                      <p className="text-xs text-neutral-500 text-center py-4">
                        En attente des participants...
                      </p>
                    )}
                  </div>
                </div>

                {/* Leave button */}
                <button
                  onClick={leaveCollaboration}
                  className="w-full py-2 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                >
                  Quitter la session
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant pour afficher un collaborateur
function CollaboratorItem({ collaborator }: { collaborator: Collaborator }) {
  const initials = collaborator.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center gap-3 p-2 bg-neutral-800/50">
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
        style={{ backgroundColor: collaborator.color }}
      >
        {initials}
      </div>
      <div className="flex-1">
        <div className="text-sm text-white">{collaborator.name}</div>
        <div className={`text-[10px] flex items-center gap-1 ${
          collaborator.isTyping ? 'text-blue-400' : 
          collaborator.isOnline ? 'text-green-400' : 'text-neutral-500'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            collaborator.isTyping ? 'bg-blue-400 animate-pulse' :
            collaborator.isOnline ? 'bg-green-400' : 'bg-neutral-500'
          }`} />
          {collaborator.isTyping ? 'En train d\'écrire...' : 
           collaborator.isOnline ? 'En ligne' : 'Hors ligne'}
        </div>
      </div>
    </div>
  )
}

// Composant compact pour la barre supérieure
export function CollaborationBar() {
  const { isCollabActive, collaborators, typingUsers, inviteCode } = useCollaborationContext()
  const [showPanel, setShowPanel] = useState(false)

  if (!isCollabActive) return null

  return (
    <>
      <div className="fixed top-0 left-16 sm:left-20 lg:left-64 right-0 h-12 bg-blue-800/90 backdrop-blur-sm z-40 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-sm">
              Mode Collaboration
            </span>
            <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-mono">
              {inviteCode}
            </span>
          </div>
          
          {/* Avatars des participants */}
          <div className="flex -space-x-2">
            {collaborators.slice(0, 4).map((collab) => (
              <div
                key={collab.id}
                className="w-7 h-7 rounded-full border-2 border-blue-800 flex items-center justify-center text-white text-[10px] font-medium"
                style={{ backgroundColor: collab.color }}
                title={collab.name}
              >
                {collab.name.charAt(0)}
              </div>
            ))}
            {collaborators.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-blue-800 bg-neutral-700 flex items-center justify-center text-white text-[10px]">
                +{collaborators.length - 4}
              </div>
            )}
          </div>

          {/* Indicateur de frappe */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} écrit...`
                  : `${typingUsers.length} personnes écrivent...`
                }
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowPanel(true)}
          className="px-3 py-1.5 bg-white/20 text-white text-xs hover:bg-white/30 transition-colors"
        >
          Gérer
        </button>
      </div>

      <CollaborationPanel isOpen={showPanel} onClose={() => setShowPanel(false)} />
    </>
  )
}

