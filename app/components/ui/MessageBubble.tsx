'use client'

import React, { useMemo } from 'react'
import BlockRevealText from '../BlockRevealText'
import CodeBlock from '../CodeBlock'
import { WebSources } from './WebSources'
import { MessageActions } from './MessageActions'
import type { Message } from '../../hooks/useChat'

interface MessageBubbleProps {
  message: Message
  isAnimated?: boolean
}

// Parser pour extraire les blocs de code du texte
function parseMessageContent(content: string): Array<{ type: 'text' | 'code'; content: string; language?: string; filename?: string }> {
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string; filename?: string }> = []
  
  // Regex pour détecter les blocs de code avec format ```language:filename ou ```language
  const codeBlockRegex = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g
  
  let lastIndex = 0
  let match
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Ajouter le texte avant le bloc de code
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim()
      if (textBefore) {
        parts.push({ type: 'text', content: textBefore })
      }
    }
    
    // Ajouter le bloc de code
    const language = match[1] || 'text'
    const filename = match[2] || undefined
    const code = match[3].trim()
    
    parts.push({
      type: 'code',
      content: code,
      language,
      filename
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // Ajouter le texte restant après le dernier bloc de code
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex).trim()
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText })
    }
  }
  
  // Si aucun bloc de code trouvé, retourner tout le contenu comme texte
  if (parts.length === 0) {
    parts.push({ type: 'text', content: content })
  }
  
  return parts
}

export function MessageBubble({ message, isAnimated = true }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  
  const formatTime = (date?: Date) => {
    if (!date) return ''
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  // Parser le contenu pour extraire les blocs de code
  const parsedContent = useMemo(() => {
    if (isUser) return null
    return parseMessageContent(message.content)
  }, [message.content, isUser])

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[70%] lg:max-w-[256px] flex flex-col items-end">
          <p className="text-text-secondary text-xs font-normal text-right">
            {message.content}
          </p>
          
          {/* Attached files */}
          {message.files && message.files.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {message.files.map((file, index) => (
                <div
                  key={index}
                  className="px-3 py-2 border border-neutral-400 flex flex-col gap-2 max-w-[200px] sm:max-w-[250px]"
                >
                  <div className="flex items-center gap-1">
                    <img src="/piecejointe.svg" alt="" className="w-3 h-3.5" />
                    <span className="text-white text-xs">Pièce jointe</span>
                    <span className="text-neutral-600 text-[8px]">
                      {(file.size / 1024 / 1024).toFixed(2)}MB
                    </span>
                  </div>
                  <div className="relative overflow-hidden">
                    <span className="text-white text-xs font-light whitespace-nowrap">
                      {file.name}
                    </span>
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2.5 py-2.5 pr-2.5">
            <span className="text-text-secondary text-[10px]">Salah-Eddine Sriar</span>
            <span className="text-white/20 text-[10px]">{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-1.5 max-w-[85%] sm:max-w-[80%] lg:max-w-[700px]">
        <div className="w-5 h-5 flex-shrink-0">
          <img src="/IA.svg" alt="IA" className="w-full h-full" />
        </div>
        <div className="p-1.5 flex flex-col gap-3">
          {parsedContent?.map((part, index) => (
            <React.Fragment key={index}>
              {part.type === 'text' ? (
                <div className="text-white text-xs font-normal">
                  {isAnimated && index === 0 ? (
                    <BlockRevealText text={part.content} delay={0.1} />
                  ) : (
                    <span className="whitespace-pre-wrap">{part.content}</span>
                  )}
                </div>
              ) : (
                <CodeBlock 
                  code={part.content} 
                  language={part.language || 'text'} 
                  filename={part.filename}
                />
              )}
            </React.Fragment>
          ))}
          
          {/* Sources web */}
          {message.webSources && message.webSources.length > 0 && (
            <WebSources sources={message.webSources} />
          )}
          
          {/* Actions du message (copier, régénérer, etc.) */}
          {!isUser && (
            <MessageActions message={message.content} />
          )}
        </div>
      </div>
    </div>
  )
}
