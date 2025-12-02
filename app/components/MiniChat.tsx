'use client'

import React, { useState, useRef, useEffect } from 'react'
import BlockRevealText from './BlockRevealText'
import IALoadingAnimation from './IALoadingAnimation'
import CodeBlock from './CodeBlock'
import { useDashboard } from '../contexts/DashboardContext'
import { useLearning } from '../hooks/useLearning'

interface CodeBlockData {
  code: string
  language: string
  filename?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  codeBlocks?: CodeBlockData[]
  modification?: {
    type: string
    description: string
  } | null
}

// Fonction pour extraire les blocs de code du contenu
function parseMessageContent(content: string): { text: string; codeBlocks: CodeBlockData[] } {
  const codeBlockRegex = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g
  const codeBlocks: CodeBlockData[] = []
  let text = content

  let match
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text'
    const filename = match[2]
    const code = match[3].trim()
    
    codeBlocks.push({ code, language, filename })
    text = text.replace(match[0], `[CODE_BLOCK_${codeBlocks.length - 1}]`)
  }

  return { text, codeBlocks }
}

interface Suggestion {
  text: string
  category: string
}

export function MiniChat() {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [bestSuggestion, setBestSuggestion] = useState<Suggestion | null>(null)
  const { 
    burnrateConfig, 
    spendingConfig, 
    trackerConfig,
    selectedChart,
    setSelectedChart,
    updateBurnrateConfig, 
    updateSpendingConfig, 
    updateTrackerConfig 
  } = useDashboard()
  
  // Hook d'apprentissage
  const { logConversation, suggestions: learnedSuggestions } = useLearning()
  
  // Noms des graphiques pour l'affichage
  const chartNames: Record<string, string> = {
    burnrate: burnrateConfig.title,
    spending: spendingConfig.title,
    tracker: trackerConfig.title
  }
  const [showBottomFade, setShowBottomFade] = useState(false)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const conversationScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll vers le bas
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Vérifier si le fondu doit être affiché
  useEffect(() => {
    const checkScroll = () => {
      if (conversationScrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = conversationScrollRef.current
        const isScrollable = scrollHeight > clientHeight
        setShowBottomFade(isScrollable && scrollTop < scrollHeight - clientHeight - 1)
      }
    }

    checkScroll()
    const scrollElement = conversationScrollRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll)
      return () => scrollElement.removeEventListener('scroll', checkScroll)
    }
  }, [messages, isLoading])

  const handleSuggestionClick = (suggestionText: string) => {
    setInputValue(suggestionText)
  }

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage = inputValue.trim()
      setInputValue('')
      setIsLoading(true)
      // Effacer les suggestions quand on envoie un message
      setSuggestions([])
      setBestSuggestion(null)

      // Ajouter le message utilisateur
      const newMessages: Message[] = [...messages, { role: 'user', content: userMessage, modification: null }]
      setMessages(newMessages)

      try {
        // Appeler l'agent unifié du dashboard
        const response = await fetch('/api/dashboard-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            currentConfig: {
              burnrate: burnrateConfig,
              spending: spendingConfig,
              tracker: trackerConfig
            }
          }),
        })

        if (response.ok) {
          const { message, modification, success } = await response.json()
          
          // Ajouter la réponse de l'agent
          const assistantMessage: Message = {
            role: 'assistant',
            content: message,
            modification: modification ? {
              type: modification.type,
              description: modification.description
            } : null
          }
          const updatedMessages = [...newMessages, assistantMessage]
          setMessages(updatedMessages)

          // Appliquer les modifications si présentes
          if (success && modification && modification.type !== 'none' && modification.config) {
            switch (modification.type) {
              case 'burnrate':
                updateBurnrateConfig(modification.config)
                break
              case 'spending':
                updateSpendingConfig(modification.config)
                break
              case 'tracker':
                updateTrackerConfig(modification.config)
                break
            }
          }
          
          // Enregistrer la conversation pour l'apprentissage
          logConversation(userMessage, message, modification?.config)

          // Générer des suggestions contextuelles en arrière-plan
          fetch('/api/dashboard-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              messages: updatedMessages,
              currentConfig: {
                burnrate: burnrateConfig,
                spending: spendingConfig,
                tracker: trackerConfig
              }
            }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.bestSuggestion && data.suggestions) {
                setBestSuggestion({
                  text: data.bestSuggestion,
                  category: "Contextual"
                })
                setSuggestions(
                  data.suggestions.map((text: string) => ({ text, category: "Contextual" }))
                )
              }
            })
            .catch(error => console.error('Erreur suggestions:', error))

        } else {
          setMessages([...newMessages, {
            role: 'assistant',
            content: "Désolé, j'ai rencontré un problème. Pouvez-vous reformuler votre demande ?",
            modification: null
          }])
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error)
        setMessages([...newMessages, {
          role: 'assistant',
          content: "Une erreur de connexion s'est produite. Veuillez réessayer.",
          modification: null
        }])
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Titre */}
      <div className="px-[15px] py-[15px]">
        <div className="inline-flex justify-start items-center">
          <div className="justify-start text-white text-xl font-light ">Assistance</div>
          <div className="p-2.5 flex justify-start items-center gap-2.5">
            <img src="/Star 1.svg" alt="Star" className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Zone de conversation */}
      <div
        ref={conversationScrollRef}
        className="flex-1 px-[11px] overflow-y-auto overflow-x-hidden"
        style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
      >
        <div className="flex flex-col gap-[20px]">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[300px] inline-flex flex-col justify-start items-start">
                  <div className="self-stretch justify-start text-xs font-normal " style={{color: '#616161'}}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="inline-flex justify-start items-start gap-1.5 w-full">
                  <div className="w-5 h-5 relative flex-shrink-0">
                    <img src="/IA.svg" alt="IA" className="w-full h-full" />
                  </div>
                  <div className="p-[5px] flex flex-col justify-start items-start flex-1 max-w-[600px] gap-2">
                    {/* Rendu du contenu avec blocs de code */}
                    {(() => {
                      const { text, codeBlocks } = parseMessageContent(msg.content)
                      const parts = text.split(/\[CODE_BLOCK_(\d+)\]/)
                      
                      return parts.map((part, i) => {
                        // Si c'est un index de code block
                        if (i % 2 === 1) {
                          const blockIndex = parseInt(part)
                          const block = codeBlocks[blockIndex]
                          if (block) {
                            return (
                              <div key={`code-${i}`} className="w-full">
                                <CodeBlock 
                                  code={block.code}
                                  language={block.language}
                                  filename={block.filename}
                                />
                              </div>
                            )
                          }
                          return null
                        }
                        // Sinon c'est du texte (affiché directement sans animation pour cohérence)
                        if (part.trim()) {
                          return (
                            <div key={`text-${i}`} className="text-white text-xs font-normal  leading-relaxed">
                              {part.trim()}
                            </div>
                          )
                        }
                        return null
                      })
                    })()}
                    {/* Badge de modification */}
                    {msg.modification && msg.modification.type !== 'none' && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="text-green-400 text-[10px]">
                          ✓ {msg.modification.description || `Graphique ${msg.modification.type} modifié`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <IALoadingAnimation />
            </div>
          )}
          <div ref={conversationEndRef} />
        </div>
      </div>

      {/* Fondu en bas */}
      {showBottomFade && (
        <div className="absolute bottom-[110px] left-0 right-0 h-10 bg-gradient-to-t from-neutral-800 to-transparent pointer-events-none" />
      )}

      {/* Suggestions contextuelles */}
      {messages.length > 0 && (bestSuggestion || suggestions.length > 0) && (
        <div className="px-[11px] pb-[2px]">
          <div className="flex gap-1 overflow-x-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {/* Meilleure suggestion avec dégradé bleu */}
            {bestSuggestion && (
              <div
                onClick={() => handleSuggestionClick(bestSuggestion.text)}
                className="h-9 px-3 py-1.5 bg-gradient-to-r from-blue-800 to-blue-950 inline-flex justify-start items-center gap-4 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity relative overflow-hidden"
              >
                {/* Effet lumineux animé */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
                  style={{
                    animation: 'shimmer 3s ease-in-out infinite',
                    animationDirection: 'alternate'
                  }}
                />
                <div className="justify-start text-white text-xs font-light relative z-10">{bestSuggestion.text}</div>
                <style jsx>{`
                  @keyframes shimmer {
                    0% {
                      transform: translateX(-100%);
                    }
                    100% {
                      transform: translateX(100%);
                    }
                  }
                `}</style>
              </div>
            )}
            {/* Autres suggestions */}
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion.text)}
                className="h-9 px-3 py-1.5 bg-neutral-700 inline-flex justify-start items-center gap-4 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="justify-start text-white text-xs font-light">{suggestion.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boîte de saisie */}
      <div className="px-[11px] pb-[11px]">
        {/* Badge de contexte du graphique sélectionné */}
        {selectedChart && (
          <div className="mb-2 flex items-center gap-2">
            <div className="h-6 px-3 bg-blue-800 inline-flex items-center gap-2 overflow-hidden">
              <span className="text-white text-[10px] font-semibold ">
                {chartNames[selectedChart]}
              </span>
            </div>
            <button 
              onClick={() => setSelectedChart(null)}
              className="text-neutral-500 hover:text-white text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={selectedChart ? `Demandez quelque chose sur ${chartNames[selectedChart]}...` : "Ecrivez votre message"}
            className="w-full h-12 px-3.5 bg-neutral-800 outline outline-[0.70px] outline-offset-[-0.70px] outline-neutral-400 text-white placeholder:text-neutral-600 text-sm font-normal  border-none"
            style={{outline: '0.70px solid rgb(163, 163, 163)'}}
          />
          <button
            onClick={handleSendMessage}
            className="absolute right-[11px] top-1/2 -translate-y-1/2 w-11 h-9 bg-blue-800 flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 10L10 2M10 2H4M10 2V8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
