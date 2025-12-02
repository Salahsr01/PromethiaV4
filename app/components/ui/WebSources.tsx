'use client'

import React, { useState, useRef, useEffect } from 'react'

interface WebSource {
  title: string
  url: string
  snippet: string
  publishedDate?: string
}

interface WebSourcesProps {
  sources: WebSource[]
  className?: string
}

// Fonction pour obtenir l'URL du favicon via Google
function getFaviconUrl(url: string, size: number = 32): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
  } catch {
    return `https://www.google.com/s2/favicons?domain=${url}&sz=${size}`
  }
}

export function WebSources({ sources, className = '' }: WebSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const sourcesListRef = useRef<HTMLDivElement>(null)

  if (!sources || sources.length === 0) {
    return null
  }

  // Limiter à 3 sources pour l'affichage compact
  const displaySources = sources.slice(0, 3)
  const hasMore = sources.length > 3

  // Scroll automatique quand on ouvre la liste détaillée
  useEffect(() => {
    if (isExpanded && sourcesListRef.current) {
      // Délai pour que l'animation d'expansion se termine
      setTimeout(() => {
        sourcesListRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
      }, 150)
    }
  }, [isExpanded])

  return (
    <div className={`flex flex-col gap-2 mt-3 ${className}`}>
      {/* Citations compactes avec logos - style ChatGPT */}
      <div className="flex flex-wrap items-center gap-2">
        {displaySources.map((source, index) => (
          <button
            key={index}
            onClick={() => window.open(source.url, '_blank', 'noopener,noreferrer')}
            className="group/citation inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/15 transition-all"
            aria-label={`Source: ${source.title}`}
          >
            <img
              src={getFaviconUrl(source.url, 16)}
              alt=""
              className="w-4 h-4 rounded-full flex-shrink-0"
              onError={(e) => {
                // Fallback si le favicon ne charge pas
                e.currentTarget.style.display = 'none'
              }}
            />
            <span className="text-white/90 text-[10px] sm:text-xs font-medium truncate max-w-[120px] sm:max-w-[200px]">
              {source.title}
            </span>
            {hasMore && index === displaySources.length - 1 && (
              <span className="text-white/50 text-[10px] font-medium ml-0.5">
                +{sources.length - displaySources.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bouton Sources - style ChatGPT avec favicons */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded)
          // Le scroll sera géré par useEffect
        }}
        className="group/footnote bg-[var(--color-token-bg-primary)] hover:bg-[var(--color-token-bg-tertiary)] flex w-fit items-center gap-2 px-3 py-1.5"
        aria-label="Sources"
      >
        {/* Favicons des sources - empilés avec flex-row-reverse */}
        <div className="relative inline-block shrink-0">
          <div className="flex flex-row-reverse items-center">
            {sources.slice(0, 3).map((source, index) => (
              <img
                key={index}
                src={getFaviconUrl(source.url, 16)}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4 rounded-full border border-white/20 border-[0.5px] duration-200 motion-safe:transition-opacity opacity-100"
                style={{
                  marginLeft: index > 0 ? '-4px' : '0',
                  zIndex: sources.length - index,
                  position: 'relative'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ))}
          </div>
        </div>
        {/* Texte Sources */}
        <div className="text-white/60 mt-[-1px] text-[13px] font-medium">
          Sources
        </div>
      </button>

      {/* Liste détaillée des sources (expandable) */}
      {isExpanded && (
        <div 
          ref={sourcesListRef}
          className="mt-2 space-y-2 p-3 bg-white/5"
        >
          {sources.map((source, index) => (
            <a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/source flex items-start gap-3 p-2 hover:bg-white/5 transition-colors"
            >
              <img
                src={getFaviconUrl(source.url, 32)}
                alt=""
                className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
                onError={(e) => {
                  // Fallback si le favicon ne charge pas
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-xs font-medium mb-1 group-hover/source:text-blue-400 transition-colors">
                  {source.title}
                </h4>
                <p className="text-white/60 text-[10px] sm:text-xs line-clamp-2 mb-1.5">
                  {source.snippet}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-[9px] truncate max-w-[200px] sm:max-w-[300px]">
                    {new URL(source.url).hostname}
                  </span>
                  {source.publishedDate && (
                    <>
                      <span className="text-white/30 text-[9px]">•</span>
                      <span className="text-white/40 text-[9px]">
                        {new Date(source.publishedDate).toLocaleDateString('fr-FR')}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <svg
                className="w-4 h-4 text-white/40 group-hover/source:text-white/60 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

