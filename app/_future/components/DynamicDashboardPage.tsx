'use client'

/**
 * Page de Dashboard Dynamique
 * 
 * Cette page remplacera l'actuelle page tableau-de-bord une fois activée.
 * Elle permet à l'IA de créer/modifier/supprimer des widgets dynamiquement.
 * 
 * POUR ACTIVER :
 * 1. Copier ce fichier vers app/tableau-de-bord/page.tsx
 * 2. Importer DynamicDashboardProvider dans le layout
 */

import { useState, useRef, useEffect } from 'react'
import { DynamicDashboardProvider, useDynamicDashboard } from '../contexts/DynamicDashboardContext'
import { DynamicWidget } from './DynamicWidget'
import { Sidebar } from '../../components/ui/Sidebar'
import BlockRevealText from '../../components/BlockRevealText'
import IALoadingAnimation from '../../components/IALoadingAnimation'

function DashboardContent() {
  const { 
    widgets, 
    dispatch, 
    selectWidget, 
    selectedWidgetId,
    getDataForCategory,
    isEditing,
    setIsEditing
  } = useDynamicDashboard()

  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/dashboard-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentWidgets: widgets.map(w => ({
            id: w.id,
            type: w.type,
            title: w.title,
            dataCategory: w.dataCategory
          }))
        })
      })

      if (response.ok) {
        const { message, actions, suggestions } = await response.json()

        // Ajouter la réponse
        setMessages(prev => [...prev, { role: 'assistant', content: message }])

        // Exécuter les actions
        for (const action of actions) {
          dispatch(action)
        }

        // Afficher les suggestions si présentes
        if (suggestions?.length > 0) {
          const suggestionsText = suggestions
            .map((s: { widgetType: string; reason: string }) => `• ${s.widgetType}: ${s.reason}`)
            .join('\n')
          console.log('Suggestions:', suggestionsText)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Erreur de communication. Veuillez réessayer." 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-[#141414]">
      <Sidebar currentPage="dashboard" />

      <div className="ml-16 sm:ml-20 lg:ml-64 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-xl font-light">Tableau de Bord Dynamique</h1>
            <p className="text-neutral-500 text-sm">
              {widgets.length} widget{widgets.length > 1 ? 's' : ''} • 
              Demandez à l'IA de modifier le dashboard
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded text-sm transition-colors ${
              isEditing 
                ? 'bg-blue-600 text-white' 
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            }`}
          >
            {isEditing ? 'Terminer' : 'Modifier'}
          </button>
        </div>

        {/* Grille de widgets */}
        <div 
          className="grid gap-4 mb-6"
          style={{ 
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridAutoRows: '180px'
          }}
        >
          {widgets.map(widget => (
            <DynamicWidget
              key={widget.id}
              config={widget}
              data={getDataForCategory(widget.dataCategory)}
              isSelected={selectedWidgetId === widget.id}
              onSelect={() => selectWidget(widget.id)}
              isEditing={isEditing}
            />
          ))}
        </div>

        {/* Chat IA pour construire le dashboard */}
        <div className="bg-neutral-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <img src="/IA.svg" alt="IA" className="w-5 h-5" />
            <span className="text-white text-sm font-medium">Assistant Dashboard</span>
            <span className="text-neutral-500 text-xs">
              Demandez-moi d'ajouter, modifier ou supprimer des widgets
            </span>
          </div>

          {/* Messages */}
          {messages.length > 0 && (
            <div 
              className="max-h-48 overflow-y-auto mb-4 space-y-3"
              style={{ scrollbarWidth: 'thin' }}
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? (
                    <div className="max-w-[80%] bg-blue-600/20 border border-blue-500/30 rounded px-3 py-2">
                      <p className="text-blue-100 text-xs">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[80%] flex gap-2">
                      <img src="/IA.svg" alt="IA" className="w-4 h-4 mt-1" />
                      <div className="bg-neutral-700/50 rounded px-3 py-2">
                        <p className="text-white text-xs">
                          <BlockRevealText text={msg.content} delay={0.05} />
                        </p>
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
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input */}
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ex: Remplace le tracker par un graphique de stock..."
              className="w-full h-10 pl-3 pr-12 bg-neutral-900 border border-neutral-600 rounded text-white placeholder:text-neutral-500 text-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded flex items-center justify-center ${
                inputValue.trim() && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-neutral-700'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Suggestions rapides */}
          <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              "Ajoute un KPI revenus",
              "Remplace tracker par stock",
              "Mets le burnrate en barres",
              "Ajoute un tableau clients"
            ].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setInputValue(suggestion)}
                className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-[10px] rounded whitespace-nowrap"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DynamicDashboardPage() {
  return (
    <DynamicDashboardProvider>
      <DashboardContent />
    </DynamicDashboardProvider>
  )
}

