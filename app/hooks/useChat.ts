'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface WebSource {
  title: string
  url: string
  snippet: string
  publishedDate?: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  files?: Array<{ name: string; size: number; type: string }>
  timestamp?: Date
  webSources?: WebSource[]
}

export interface Suggestion {
  text: string
  category: string
}

interface UseChatOptions {
  onTitleGenerated?: (title: string) => void
  onSuggestionsGenerated?: (best: Suggestion | null, others: Suggestion[]) => void
  onAssistantMessage?: (message: string) => void
  enableWebSearch?: boolean // Activer la recherche web automatique
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationTitle, setConversationTitle] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (
    content: string,
    files?: File[]
  ) => {
    if (!content.trim() || isLoading) return

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const attachedFiles = files?.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }))

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      files: attachedFiles,
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      // Generate title for first message
      if (messages.length === 0) {
        const titleResponse = await fetch('/api/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: content }),
          signal: abortControllerRef.current.signal
        })

        if (titleResponse.ok) {
          const { title } = await titleResponse.json()
          setConversationTitle(title)
          options.onTitleGenerated?.(title)
        }
      }

      // Send message to AI
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          enableWebSearch: options.enableWebSearch ?? false
        }),
        signal: abortControllerRef.current.signal
      })

      if (chatResponse.ok) {
        const { message: aiMessage, webSearchResults } = await chatResponse.json()
        const assistantMessage: Message = {
          role: 'assistant',
          content: aiMessage,
          timestamp: new Date(),
          webSources: webSearchResults || undefined
        }
        const updatedMessages = [...newMessages, assistantMessage]
        setMessages(updatedMessages)
        setIsLoading(false)
        
        // Notifier du message de l'assistant
        options.onAssistantMessage?.(aiMessage)

        // Generate suggestions in background
        fetch('/api/generate-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: updatedMessages })
        })
          .then(response => response.json())
          .then(data => {
            if (data.bestSuggestion && data.suggestions) {
              options.onSuggestionsGenerated?.(
                { text: data.bestSuggestion, category: 'Contextual' },
                data.suggestions.map((text: string) => ({ text, category: 'Contextual' }))
              )
            }
          })
          .catch(console.error)
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sending message:', error)
      }
      setIsLoading(false)
    }
  }, [messages, isLoading, options])

  const resetConversation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setMessages([])
    setConversationTitle('')
    setIsLoading(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    messages,
    isLoading,
    conversationTitle,
    sendMessage,
    resetConversation,
    hasMessages: messages.length > 0
  }
}

