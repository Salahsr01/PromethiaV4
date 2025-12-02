'use client'

import React, { useRef, useState } from 'react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onFilesSelected?: (files: File[]) => void
  isLoading?: boolean
  placeholder?: string
  showActions?: boolean
  isCollabActive?: boolean
  onCollabToggle?: () => void
  isWebSearchActive?: boolean
  onWebSearchToggle?: () => void
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onFilesSelected,
  isLoading = false,
  placeholder = "Ecrivez votre message",
  showActions = true,
  isCollabActive = false,
  onCollabToggle,
  isWebSearchActive = false,
  onWebSearchToggle
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend()
      setSelectedFiles([])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...filesArray])
      onFilesSelected?.(filesArray)
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const canSend = value.trim() && !isLoading

  return (
    <div className="w-full">
      {/* Selected files display */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="px-3 py-2 border border-neutral-400 inline-flex flex-col gap-1 max-w-[200px] sm:max-w-[300px] bg-surface-elevated"
            >
              <div className="flex items-center gap-1">
                <img src="/piecejointe.svg" alt="" className="w-3 h-3.5" />
                <span className="text-white text-xs">Pièce jointe</span>
                <span className="text-neutral-600 text-[8px]">
                  {(file.size / 1024 / 1024).toFixed(2)}MB
                </span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-400 hover:text-red-300 text-xs ml-auto"
                  aria-label="Supprimer le fichier"
                >
                  ✕
                </button>
              </div>
              <div className="relative overflow-hidden">
                <span className="text-white text-xs font-light whitespace-nowrap">
                  {file.name}
                </span>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-elevated to-transparent pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input box */}
      <div className="bg-fondchat flex w-full h-14 sm:h-[70px] items-center border border-border relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="text-white placeholder:text-text-muted bg-transparent text-xs sm:text-sm font-normal ml-3 sm:ml-5 outline-none border-none w-full pr-16 sm:pr-20 disabled:opacity-50"
        />
        
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`w-12 sm:w-16 h-10 sm:h-12 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors ${
            canSend 
              ? 'bg-primary hover:bg-primary-hover cursor-pointer' 
              : 'bg-neutral-700 cursor-not-allowed'
          }`}
          aria-label="Envoyer"
        >
          <img src="/fleche.svg" alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-6 mt-2 sm:mt-3">
          {/* Bouton recherche web avec style actif/inactif */}
          <button 
            onClick={() => {
              if (onWebSearchToggle) {
                onWebSearchToggle()
              }
            }}
            className={`p-2 inline-flex items-center gap-2 transition-all ${
              isWebSearchActive 
                ? '!bg-white !text-black hover:!bg-gray-100' 
                : 'bg-transparent hover:opacity-80 text-neutral-600'
            }`}
            style={isWebSearchActive ? { 
              backgroundColor: '#ffffff', 
              color: '#000000' 
            } : { 
              backgroundColor: 'transparent',
              color: 'inherit'
            }}
          >
            <img 
              src="/internet.svg" 
              alt="" 
              className={`w-3 h-3 ${isWebSearchActive ? 'brightness-0' : ''}`}
            />
            <span 
              className={`text-[10px] sm:text-xs hidden sm:inline ${
                isWebSearchActive ? '!text-black' : 'text-neutral-600'
              }`} 
              style={isWebSearchActive ? { 
                color: '#000000' 
              } : { 
                color: 'rgb(82, 82, 91)' 
              }}
            >
              Recherché sur internet
            </span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src="/piecejointe.svg" alt="" className="w-3 h-3" />
            <span className="text-neutral-600 text-[10px] sm:text-xs hidden sm:inline">Ajouté une pièce jointe</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {onCollabToggle && (
            <button
              onClick={onCollabToggle}
              className={`h-7 sm:h-8 px-2 sm:px-2.5 inline-flex items-center gap-1.5 sm:gap-2.5 transition-colors ${
                isCollabActive ? 'bg-green-700' : 'bg-blue-800'
              }`}
            >
              <img src="/cursor.svg" alt="" className="w-3 h-3" />
              <span className={`text-[10px] sm:text-xs font-normal ${
                isCollabActive ? 'text-green-400' : 'text-blue-500'
              }`}>
                <span className="hidden sm:inline">Mode </span>Collaboration
              </span>
              <span className="text-white text-[8px] sm:text-[10px] hidden lg:inline">
                Nouveau !
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

