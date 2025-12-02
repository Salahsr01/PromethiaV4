'use client'

import React from 'react'
import type { Suggestion } from '../../hooks/useChat'

interface SuggestionChipsProps {
  suggestions: Suggestion[]
  bestSuggestion?: Suggestion | null
  onSelect: (text: string) => void
  variant?: 'default' | 'compact'
}

export function SuggestionChips({
  suggestions,
  bestSuggestion,
  onSelect,
  variant = 'default'
}: SuggestionChipsProps) {
  if (!bestSuggestion && suggestions.length === 0) return null

  const isCompact = variant === 'compact'
  const chipHeight = isCompact ? 'h-8' : 'h-9 sm:h-10'
  const textSize = isCompact ? 'text-[11px]' : 'text-xs sm:text-sm'

  return (
    <div className="relative">
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar pb-1">
        {/* Best suggestion with shimmer effect */}
        {bestSuggestion && (
        <button
          onClick={() => onSelect(bestSuggestion.text)}
          className={`${chipHeight} px-2 sm:px-3 bg-gradient-to-r from-blue-800 to-blue-950 flex items-center gap-2 sm:gap-4 flex-shrink-0 hover:opacity-90 transition-opacity relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none animate-shimmer" />
          <span className={`text-white ${textSize} font-light relative z-10 truncate max-w-[200px] sm:max-w-[300px]`}>
            {bestSuggestion.text}
          </span>
        </button>
      )}
      
      {/* Other suggestions */}
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion.text)}
          className={`${chipHeight} px-2 sm:px-3 bg-neutral-800 flex items-center gap-2 sm:gap-4 flex-shrink-0 hover:opacity-80 transition-opacity`}
        >
          <span className={`text-white ${textSize} font-light truncate max-w-[180px] sm:max-w-[280px]`}>
            {suggestion.text}
          </span>
        </button>
      ))}
      </div>

    </div>
  )
}

// Static suggestions for initial state
interface StaticSuggestionsProps {
  onSelect: (text: string) => void
}

export function StaticSuggestions({ onSelect }: StaticSuggestionsProps) {
  const staticSuggestions = [
    { text: "Donne moi les équipement qui sont pas loin du stock minimum", tag: "Stock", icon: "/base.svg" },
    { text: "les changement qui impactes mon secteur", tag: "Google", icon: "/google.svg" },
    { text: "Quelles Clients a le plus dépensé", tag: "Client", icon: "/sql.svg" },
  ]

  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-white text-base sm:text-lg lg:text-xl font-light">
          Suggestion de l&apos;IA
        </h2>
        <img src="/Star 1.svg" alt="" className="w-3 h-3" />
      </div>

      <div className="relative">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-2">
        {staticSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion.text)}
            className="h-11 sm:h-12 px-3 sm:px-4 py-1.5 bg-neutral-200 flex items-center gap-4 sm:gap-6 flex-shrink-0 hover:bg-neutral-300 transition-colors"
          >
            <span className="text-black text-xs sm:text-sm font-light whitespace-nowrap">
              {suggestion.text}
            </span>
            <div className="px-3 sm:px-4 py-1.5 bg-neutral-800 border border-neutral-400 flex items-center gap-2 sm:gap-3">
              <span className="text-white text-xs sm:text-sm font-light">{suggestion.tag}</span>
              <img src={suggestion.icon} alt="" className="w-4 h-4" />
            </div>
          </button>
        ))}
        </div>

      </div>
    </div>
  )
}

