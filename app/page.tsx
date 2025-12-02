'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Sidebar } from './components/ui/Sidebar'
import { ChatInput } from './components/ui/ChatInput'
import { MessageBubble } from './components/ui/MessageBubble'
import { SuggestionChips, StaticSuggestions } from './components/ui/SuggestionChips'
import { useChat, type Suggestion } from './hooks/useChat'
import IALoadingAnimation from './components/IALoadingAnimation'
import { CollaborationBar, CollaborationPanel } from './components/CollaborationPanel'
import { useCollaborationContext, type CollaborativeMessage } from './contexts/CollaborationContext'

// Composant pour afficher un message collaboratif (format similaire au chat normal)
function CollabMessageBubble({ message, isOwnMessage }: { message: CollaborativeMessage; isOwnMessage: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  
  if (isOwnMessage) {
    // Format utilisateur (aligné à droite, comme MessageBubble)
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[70%] lg:max-w-[256px] flex flex-col items-end">
          <p className="text-text-secondary text-xs font-normal text-right">
            {message.content}
          </p>
          <div className="flex items-center gap-2.5 py-2.5 pr-2.5">
            <span className="text-text-secondary text-[10px]">{message.visitorName}</span>
            <span className="text-white/20 text-[10px]">{time}</span>
          </div>
        </div>
      </div>
    )
  }

  // Format autre participant (aligné à gauche avec avatar coloré)
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-1.5 max-w-[85%] sm:max-w-[80%] lg:max-w-[700px]">
        <div 
          className="w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-white text-[8px] font-medium"
          style={{ backgroundColor: message.visitorColor }}
        >
          {message.visitorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div className="p-1.5 flex flex-col">
          <p className="text-white text-xs font-normal">
            {message.content}
          </p>
          <div className="flex items-center gap-2.5 py-1.5">
            <span className="text-text-secondary text-[10px]">{message.visitorName}</span>
            <span className="text-white/20 text-[10px]">{time}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const [inputValue, setInputValue] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [bestSuggestion, setBestSuggestion] = useState<Suggestion | null>(null)
  const [showCollabPanel, setShowCollabPanel] = useState(false)
  const [isWebSearchActive, setIsWebSearchActive] = useState(false)
  
  const { 
    isCollabActive, 
    toggleCollaboration, 
    collaborators,
    typingUsers,
    setTyping,
    messages: collabMessages,
    sendCollabMessage,
    broadcastAIResponse,
    isAITyping,
    setAITyping,
    visitorName
  } = useCollaborationContext()
  
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const conversationScrollRef = useRef<HTMLDivElement>(null)

  const handleSuggestionsGenerated = useCallback((best: Suggestion | null, others: Suggestion[]) => {
    setBestSuggestion(best)
    setSuggestions(others)
  }, [])

  // Quand l'IA répond, partager avec tous les participants
  const handleAssistantMessage = useCallback((message: string) => {
    if (isCollabActive) {
      // Broadcaster la réponse de l'IA à tous
      broadcastAIResponse(message)
    }
  }, [isCollabActive, broadcastAIResponse])

  const { 
    messages, 
    isLoading, 
    conversationTitle, 
    sendMessage, 
    resetConversation,
    hasMessages 
  } = useChat({
    enableWebSearch: isWebSearchActive,
    onSuggestionsGenerated: handleSuggestionsGenerated,
    onAssistantMessage: handleAssistantMessage
  })

  const handleWebSearchToggle = useCallback(() => {
    setIsWebSearchActive(prev => !prev)
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, collabMessages])


  const handleSend = async () => {
    if (inputValue.trim()) {
      if (isCollabActive) {
        // Mode collaboration : envoyer le message aux autres participants
        await sendCollabMessage(inputValue)
        setTyping(false)
        // Déclencher l'animation IA sur tous les appareils
        setAITyping(true)
        // Aussi envoyer à l'IA pour obtenir une réponse partagée
        sendMessage(inputValue, selectedFiles)
      } else {
        // Mode normal : envoyer à l'IA
        sendMessage(inputValue, selectedFiles)
      }
      setInputValue('')
      setSelectedFiles([])
    }
  }

  const handleNewConversation = () => {
    resetConversation()
    setInputValue('')
    setSelectedFiles([])
    setSuggestions([])
    setBestSuggestion(null)
  }

  const handleSuggestionClick = (text: string) => {
    setInputValue(text)
  }

  // Notifier quand l'utilisateur tape
  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (isCollabActive && value.length > 0) {
      setTyping(true)
    }
  }

  // Ouvrir le panel de collaboration quand on toggle
  const handleCollabToggle = () => {
    if (!isCollabActive) {
      setShowCollabPanel(true)
    } else {
      toggleCollaboration()
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-surface">
      {/* Barre de collaboration */}
      <CollaborationBar />
      
      {/* Panel de collaboration */}
      <CollaborationPanel isOpen={showCollabPanel} onClose={() => setShowCollabPanel(false)} />
      
      {/* Sidebar */}
      <Sidebar
        conversationTitle={conversationTitle}
        isCollabActive={isCollabActive}
        onNewConversation={hasMessages ? handleNewConversation : undefined}
        currentPage="chatbox"
      />

      {/* Main content area */}
      <main className={`ml-16 sm:ml-20 lg:ml-64 min-h-screen flex flex-col ${isCollabActive ? 'pt-12' : ''}`}>
        {/* Page d'accueil : seulement si pas de messages ET pas en mode collab */}
        {!hasMessages && !isCollabActive ? (
          /* Initial state - centered content */
          <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-8 lg:px-12 py-12">
            <div className="w-full max-w-3xl">
              {/* User info and team - visible on larger screens */}
              <div className="hidden sm:flex flex-wrap items-center gap-6 sm:gap-10 lg:gap-16 mb-12 lg:mb-16">
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="px-2.5 py-1 bg-white">
                    <span className="text-black text-xs">Compte Pro +</span>
                  </div>
                  <span className="text-white text-xs font-light">Salah-Eddine Sriar</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="px-2.5 py-1 bg-white">
                    <span className="text-black text-xs">
                      {isCollabActive ? 'Collaboration Active' : 'Équipe Connecté'}
                    </span>
                  </div>
                  <div className="flex items-end gap-3 sm:gap-4">
                    {isCollabActive && collaborators.length > 0 ? (
                      // Afficher les collaborateurs en temps réel
                      collaborators.map((collab) => (
                        <div key={collab.id} className="flex flex-col gap-0.5">
                          <span className="text-white text-xs font-light">{collab.name}</span>
                          <div className="flex items-center gap-1">
                            <span className={`text-[6px] font-light ${collab.isTyping ? 'text-blue-400' : 'text-white'}`}>
                              {collab.isTyping ? 'Écrit...' : 'Connecté'}
                            </span>
                            <div className={`w-1 h-1 rounded-full ${collab.isTyping ? 'bg-blue-400 animate-pulse' : 'bg-lime-600'}`} />
                          </div>
                        </div>
                      ))
                    ) : (
                      // Affichage par défaut
                      <>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white text-xs font-light">Elio CHIRAT</span>
                          <div className="flex items-center gap-1">
                            <span className="text-white text-[6px] font-light">Connecté</span>
                            <div className="w-1 h-1 bg-lime-600 rounded-full" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-zinc-600 text-xs font-light">Zaki AIT YOUNES</span>
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-600 text-[6px] font-light">Déconnecté</span>
                            <div className="w-1 h-1 bg-zinc-600 rounded-full" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="mb-8">
                <StaticSuggestions onSelect={handleSuggestionClick} />
              </div>

              {/* Chat input */}
              <ChatInput
                value={inputValue}
                onChange={handleInputChange}
                onSend={handleSend}
                onFilesSelected={(files) => setSelectedFiles(prev => [...prev, ...files])}
                isLoading={isLoading}
                isCollabActive={isCollabActive}
                onCollabToggle={handleCollabToggle}
                isWebSearchActive={isWebSearchActive}
                onWebSearchToggle={handleWebSearchToggle}
              />

              {/* History section */}
              <div className="mt-12 sm:mt-16">
                <div className="flex items-center gap-3 py-3">
                  <span className="text-white text-sm sm:text-base font-light">Historique</span>
                  <span className="text-neutral-600 text-xs font-light">23 Message</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 py-3">
                  <span className="text-white text-[10px] font-light">
                    Devenir chef de projet excellence à 22 ans
                  </span>
                  <div className="h-3.5 px-1 bg-blue-800 flex items-center gap-1">
                    <img src="/cursor.svg" alt="" className="w-1.5 h-1.5" />
                    <span className="text-blue-500 text-[5px] font-normal">Mode Collaboration</span>
                    <span className="text-white text-[4px] font-normal hidden sm:inline">
                      Disponible dans cette discusion
                    </span>
                  </div>
                  <span className="text-white text-[10px] font-light ml-auto hidden lg:inline">
                    Dernier message 10h45 par
                  </span>
                  <span className="text-stone-300 text-[10px] font-light hidden lg:inline">
                    la personne
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Conversation state */
          <div className="flex-1 flex flex-col h-screen">
            {/* Messages area */}
            <div className="flex-1 relative overflow-hidden">
              <div
                ref={conversationScrollRef}
                className="absolute inset-0 overflow-y-auto hide-scrollbar px-6 sm:px-8 lg:px-12 pt-24 pb-10"
              >
                <div className="max-w-3xl mx-auto flex flex-col gap-8 sm:gap-12">
                  {isCollabActive ? (
                    // Messages collaboratifs + IA
                    <>
                      {collabMessages.length === 0 && messages.length === 0 && (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-4 bg-blue-800/20 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                          </div>
                          <h3 className="text-white text-lg font-light mb-2">Session Collaborative</h3>
                          <p className="text-neutral-400 text-sm">
                            {collaborators.length > 0 
                              ? `${collaborators.length + 1} participants connectés. Posez une question à l'IA !`
                              : 'En attente des participants...'
                            }
                          </p>
                        </div>
                      )}
                      {/* Tous les messages dans l'ordre (utilisateurs + IA) */}
                      {collabMessages.map((msg) => (
                        msg.isAIResponse ? (
                          // Réponse IA avec le format original et animation
                          <MessageBubble 
                            key={msg.id} 
                            message={{
                              role: 'assistant',
                              content: msg.content,
                              timestamp: new Date(msg.createdAt)
                            }} 
                          />
                        ) : (
                          // Message utilisateur
                          <CollabMessageBubble key={msg.id} message={msg} isOwnMessage={msg.visitorName === visitorName} />
                        )
                      ))}
                      {/* Animation IA visible sur tous les appareils */}
                      {(isAITyping || isLoading) && (
                        <div className="flex justify-start">
                          <IALoadingAnimation />
                        </div>
                      )}
                      {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-neutral-400 text-sm">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'écrit' : 'écrivent'}...</span>
                        </div>
                      )}
                    </>
                  ) : (
                    // Messages IA
                    <>
                      {messages.map((msg, index) => (
                        <MessageBubble key={index} message={msg} />
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <IALoadingAnimation />
                        </div>
                      )}
                    </>
                  )}
                  <div ref={conversationEndRef} />
                </div>
              </div>
              
            </div>

            {/* Input area - fixed at bottom */}
            <div className="flex-shrink-0 px-6 sm:px-8 lg:px-12 py-6 sm:py-8 bg-surface border-t border-surface-elevated">
              <div className="max-w-3xl mx-auto">
                {/* Contextual suggestions */}
                {(bestSuggestion || suggestions.length > 0) && (
                  <div className="mb-4">
                    <SuggestionChips
                      suggestions={suggestions}
                      bestSuggestion={bestSuggestion}
                      onSelect={handleSuggestionClick}
                      variant="compact"
                    />
                  </div>
                )}
                
                <ChatInput
                  value={inputValue}
                  onChange={handleInputChange}
                  onSend={handleSend}
                  onFilesSelected={(files) => setSelectedFiles(prev => [...prev, ...files])}
                  isLoading={isLoading}
                  isCollabActive={isCollabActive}
                  onCollabToggle={handleCollabToggle}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
