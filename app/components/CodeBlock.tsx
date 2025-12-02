'use client'

import React, { useState, useRef, useEffect } from 'react'

interface CodeBlockProps {
  code: string
  language: string
  filename?: string
}

// Vraies icônes SVG pour les langages
const LanguageIcon = ({ lang }: { lang: string }) => {
  switch (lang) {
    case 'python':
    case 'py':
      return (
        <svg viewBox="0 0 256 255" className="w-4 h-4">
          <defs>
            <linearGradient x1="12.959%" y1="12.039%" x2="79.639%" y2="78.201%" id="pythonA">
              <stop stopColor="#387EB8" offset="0%"/>
              <stop stopColor="#366994" offset="100%"/>
            </linearGradient>
            <linearGradient x1="19.128%" y1="20.579%" x2="90.742%" y2="88.429%" id="pythonB">
              <stop stopColor="#FFE052" offset="0%"/>
              <stop stopColor="#FFC331" offset="100%"/>
            </linearGradient>
          </defs>
          <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z" fill="url(#pythonA)"/>
          <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z" fill="url(#pythonB)"/>
        </svg>
      )
    
    case 'javascript':
    case 'js':
      return (
        <svg viewBox="0 0 256 256" className="w-4 h-4">
          <path fill="#F7DF1E" d="M0 0h256v256H0V0z"/>
          <path d="M67.312 213.932l19.59-11.856c3.78 6.701 7.218 12.371 15.465 12.371 7.905 0 12.89-3.092 12.89-15.12v-81.798h24.057v82.138c0 24.917-14.606 36.259-35.916 36.259-19.245 0-30.416-9.967-36.087-21.996M152.381 211.354l19.588-11.341c5.157 8.421 11.859 14.607 23.715 14.607 9.969 0 16.325-4.984 16.325-11.858 0-8.248-6.53-11.17-17.528-15.98l-6.013-2.58c-17.357-7.387-28.87-16.667-28.87-36.257 0-18.044 13.747-31.792 35.228-31.792 15.294 0 26.292 5.328 34.196 19.247L210.29 147.43c-4.125-7.389-8.591-10.31-15.465-10.31-7.046 0-11.514 4.468-11.514 10.31 0 7.217 4.468 10.14 14.778 14.608l6.014 2.577c20.45 8.765 31.963 17.7 31.963 37.804 0 21.654-17.012 33.51-39.867 33.51-22.339 0-36.774-10.654-43.819-24.574"/>
        </svg>
      )
    
    case 'typescript':
    case 'ts':
    case 'tsx':
      return (
        <svg viewBox="0 0 256 256" className="w-4 h-4">
          <path fill="#3178C6" d="M0 128V0h256v256H0z"/>
          <path d="M56.612 128.85v10.775h33.892v96.2h22.35v-96.2h33.892V128.85h-90.133zm130.798-1.467c6.62 1.636 12.373 4.572 17.181 8.782 2.485 2.236 6.516 6.9 6.768 7.854.084.336-12.205 8.614-19.641 13.311-.252.168-1.289-.924-2.409-2.571-3.439-4.99-7.044-7.142-12.457-7.393-7.96-.42-13.123 4.069-13.039 11.295 0 2.152.336 3.523 1.218 5.256 1.889 3.69 5.409 5.927 14.367 9.115 16.511 5.843 23.555 9.701 29.122 15.883 6.181 6.853 8.447 14.7 7.563 26.077-.924 12.457-6.349 21.828-16.176 27.922-3.439 2.152-10.903 5.088-14.868 5.843-4.656.924-15.715.756-20.707-.336-10.822-2.404-21.071-8.53-27.335-16.343-2.404-3.02-7.142-10.57-6.768-10.818.168-.168 1.555-1.05 3.103-2.068l9.953-5.759 7.729-4.488 1.636 2.404c2.32 3.438 7.31 8.195 10.315 9.869 8.614 4.74 20.371 4.069 26.049-1.386 2.404-2.32 3.439-4.74 3.439-8.195 0-3.103-.42-4.488-2.068-6.853-2.152-2.907-6.516-5.256-17.347-9.365-12.373-4.656-17.683-7.562-22.674-12.373-2.907-2.823-5.675-7.31-6.937-11.127-1.05-3.271-1.302-11.463-.504-14.952 2.74-11.8 11.295-20.035 23.639-22.774 4.992-1.05 16.595-.672 21.587.756z" fill="#FFF"/>
        </svg>
      )
    
    case 'java':
      return (
        <svg viewBox="0 0 256 346" className="w-4 h-4">
          <path d="M82.554 267.473s-13.198 7.675 9.393 10.272c27.369 3.122 41.356 2.675 71.517-3.034 0 0 7.93 4.972 19.003 9.279-67.611 28.977-153.019-1.679-99.913-16.517M74.292 229.659s-14.803 10.958 7.805 13.296c29.236 3.016 52.324 3.263 92.276-4.43 0 0 5.526 5.602 14.215 8.666-81.747 23.904-172.798 1.885-114.296-17.532" fill="#5382A1"/>
          <path d="M143.942 165.515c16.66 19.18-4.377 36.44-4.377 36.44s42.301-21.837 22.874-49.183c-18.144-25.5-32.059-38.172 43.268-81.858 0 0-118.238 29.53-61.765 94.6" fill="#E76F00"/>
          <path d="M233.364 295.442s9.767 8.047-10.757 14.273c-39.026 11.823-162.432 15.393-196.714.471-12.323-5.36 10.787-12.8 18.056-14.362 7.581-1.644 11.914-1.337 11.914-1.337-13.705-9.655-88.583 18.957-38.034 27.15 137.853 22.356 251.292-10.066 215.535-26.195M88.9 190.48s-62.771 14.91-22.228 20.323c17.118 2.292 51.243 1.774 83.03-.89 25.978-2.19 52.063-6.85 52.063-6.85s-9.16 3.923-15.787 8.448c-63.744 16.765-186.886 8.966-151.435-8.183 29.981-14.492 54.358-12.848 54.358-12.848M201.506 253.422c64.8-33.672 34.839-66.03 13.927-61.67-5.126 1.066-7.411 1.99-7.411 1.99s1.903-2.98 5.537-4.27c41.37-14.545 73.187 42.897-13.355 65.647 0 .001 1.003-.895 1.302-1.697" fill="#5382A1"/>
          <path d="M162.439.371s35.887 35.9-34.037 91.101c-56.071 44.282-12.786 69.53-.023 98.377-32.73-29.53-56.75-55.526-40.635-79.72C111.395 74.612 176.918 57.393 162.439.37" fill="#E76F00"/>
          <path d="M95.268 344.665c62.199 3.982 157.712-2.209 159.974-31.64 0 0-4.348 11.158-51.404 20.018-53.088 9.99-118.564 8.824-157.399 2.421.001 0 7.95 6.58 48.83 9.201" fill="#5382A1"/>
        </svg>
      )
    
    case 'sql':
    case 'database':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#336791">
          <path d="M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4M4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4m0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z"/>
        </svg>
      )
    
    case 'html':
      return (
        <svg viewBox="0 0 256 361" className="w-4 h-4">
          <path fill="#E44D26" d="M255.555 70.766l-23.241 260.36-104.47 28.962-104.182-28.922L.445 70.766z"/>
          <path fill="#F16529" d="M128 337.95l84.417-23.403 19.86-222.49H128z"/>
          <path fill="#EBEBEB" d="M82.82 155.932H128v-31.937H47.917l.764 8.568 7.85 88.01H128v-31.937H85.739zm7.198 80.61h-32.06l4.474 50.146 65.421 18.16.147-.04V271.58l-.14.037-35.568-9.604z"/>
          <path fill="#FFF" d="M128.085 155.932v31.937h78.89l-7.437 83.076-71.453 19.279v33.228l84.417-23.403.623-6.978 12.334-138.296.644-7.143H128.085zm0-63.933v31.937h108.92l.623-6.978 1.391-15.589 1.252-14.13.627-7.042h-112.813z"/>
        </svg>
      )
    
    case 'css':
      return (
        <svg viewBox="0 0 256 361" className="w-4 h-4">
          <path fill="#264DE4" d="M255.555 70.766l-23.241 260.36-104.47 28.962-104.182-28.922L.445 70.766z"/>
          <path fill="#2965F1" d="M128 337.95l84.417-23.403 19.86-222.49H128z"/>
          <path fill="#EBEBEB" d="M82.82 155.932H128v-31.937H47.917l.764 8.568 7.85 88.01H128v-31.937H85.739zm7.198 80.61h-32.06l4.474 50.146 65.421 18.16.147-.04V271.58l-.14.037-35.568-9.604z"/>
          <path fill="#FFF" d="M128.085 155.932v31.937h78.89l-7.437 83.076-71.453 19.279v33.228l84.417-23.403.623-6.978 12.334-138.296.644-7.143H128.085zm0-63.933v31.937h108.92l.623-6.978 1.391-15.589 1.252-14.13.627-7.042h-112.813z"/>
        </svg>
      )
    
    case 'json':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="#F5C33B" d="M12.043 23.968c.479-.004.953-.029 1.426-.094a11.805 11.805 0 003.146-.863 12.404 12.404 0 003.793-2.542 11.977 11.977 0 002.44-3.427 11.794 11.794 0 001.02-3.476c.149-1.16.135-2.346-.045-3.499a11.96 11.96 0 00-.793-2.788 11.197 11.197 0 00-.854-1.617c-1.168-1.837-2.861-3.314-4.81-4.3a12.835 12.835 0 00-2.172-.87h-.005c.119.063.24.132.345.201.553.365 1.044.804 1.46 1.312.227.277.43.574.623.883.046.074.086.153.133.225l.022.04c-.394-.095-.783-.197-1.175-.287a9.987 9.987 0 00-2.301-.304c-.658 0-1.314.068-1.958.204a9.987 9.987 0 00-2.975 1.064c-.97.535-1.836 1.213-2.585 2.022a9.897 9.897 0 00-1.78 2.732c-.44.97-.735 2.003-.88 3.06-.105.758-.14 1.527-.109 2.291.047 1.114.251 2.215.599 3.271.363 1.092.867 2.13 1.505 3.077a10.2 10.2 0 002.227 2.368c.86.691 1.81 1.265 2.823 1.71a10.867 10.867 0 003.245.91c.318.042.64.069.962.084l.064.002z"/>
        </svg>
      )
    
    case 'bash':
    case 'sh':
    case 'shell':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#4EAA25">
          <path d="M21.038 4.9l-7.577-4.498C13.009.134 12.505 0 12 0c-.505 0-1.009.134-1.461.402L2.962 4.9C2.057 5.437 1.5 6.429 1.5 7.498v8.504c0 1.069.557 2.061 1.462 2.598l7.577 4.498c.452.268.956.402 1.461.402.505 0 1.009-.134 1.461-.402l7.577-4.498c.905-.537 1.462-1.529 1.462-2.598V7.498c0-1.069-.557-2.061-1.462-2.598zM15 16.25c0 .414-.336.75-.75.75h-4.5a.75.75 0 010-1.5h4.5c.414 0 .75.336.75.75zm-4.25-3.5L8 10l2.75-2.75v5.5z"/>
        </svg>
      )
    
    case 'pdf':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#FF0000">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13H10v4.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V13H6.5a.5.5 0 0 1 0-1h2a.5.5 0 0 1 0 1zm4 0h1.5a1.5 1.5 0 0 1 0 3H13v1.5a.5.5 0 0 1-1 0V12.5a.5.5 0 0 1 .5-.5zm1.5 2H13v-1h1a.5.5 0 0 1 0 1zm3-2h2a.5.5 0 0 1 0 1h-1.5v1h1a.5.5 0 0 1 0 1h-1v1.5a.5.5 0 0 1-1 0V12.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
      )
    
    case 'md':
    case 'markdown':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#083FA1">
          <path d="M22.27 19.385H1.73A1.73 1.73 0 010 17.655V6.345a1.73 1.73 0 011.73-1.73h20.54A1.73 1.73 0 0124 6.345v11.308a1.73 1.73 0 01-1.73 1.731zM5.769 15.923v-4.5l2.308 2.885 2.307-2.885v4.5h2.308V8.078h-2.308l-2.307 2.885-2.308-2.885H3.461v7.847zM21.232 12h-2.309V8.077h-2.307V12h-2.308l3.461 4.039z"/>
        </svg>
      )
    
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#6B7280">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
        </svg>
      )
  }
}

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [thumbTop, setThumbTop] = useState(0)
  const [thumbHeight, setThumbHeight] = useState(0)
  const [showScrollbar, setShowScrollbar] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  
  const lang = language.toLowerCase()
  const displayName = filename || `code.${lang}`

  // Calcul de la scrollbar
  useEffect(() => {
    const updateScrollbar = () => {
      if (contentRef.current && trackRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = contentRef.current
        const trackHeight = trackRef.current.clientHeight

        if (scrollHeight > clientHeight) {
          setShowScrollbar(true)
          // Hauteur du thumb proportionnelle
          const newThumbHeight = Math.max(14, (clientHeight / scrollHeight) * trackHeight)
          // Position du thumb
          const maxScroll = scrollHeight - clientHeight
          const scrollRatio = scrollTop / maxScroll
          const newThumbTop = scrollRatio * (trackHeight - newThumbHeight)
          
          setThumbHeight(newThumbHeight)
          setThumbTop(newThumbTop)
        } else {
          setShowScrollbar(false)
        }
      }
    }

    updateScrollbar()
    const el = contentRef.current
    if (el) {
      el.addEventListener('scroll', updateScrollbar)
      window.addEventListener('resize', updateScrollbar)
      return () => {
        el.removeEventListener('scroll', updateScrollbar)
        window.removeEventListener('resize', updateScrollbar)
      }
    }
  }, [code])

  // Drag du thumb
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startScrollTop = contentRef.current?.scrollTop || 0
    const trackHeight = trackRef.current?.clientHeight || 1
    const scrollableHeight = (contentRef.current?.scrollHeight || 0) - (contentRef.current?.clientHeight || 0)

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY
      const scrollRatio = deltaY / (trackHeight - thumbHeight)
      if (contentRef.current) {
        contentRef.current.scrollTop = startScrollTop + scrollRatio * scrollableHeight
      }
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Click sur la track
  const handleTrackClick = (e: React.MouseEvent) => {
    if (contentRef.current && trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect()
      const clickY = e.clientY - rect.top
      const trackHeight = trackRef.current.clientHeight
      const scrollableHeight = contentRef.current.scrollHeight - contentRef.current.clientHeight
      contentRef.current.scrollTop = (clickY / trackHeight) * scrollableHeight
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erreur copie:', err)
    }
  }

  const handleDownload = () => {
    const ext = lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `code.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="my-2 w-full overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between bg-[#2a2a2a] p-3 text-white/80 text-xs"
        data-code-block-header="true"
        data-language={lang}
      >
        <div className="flex items-center gap-2">
          <LanguageIcon lang={lang} />
          <span className="text-white/60">
            {displayName}
          </span>
        </div>
        
        {/* Boutons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload}
            className="p-1.5 text-white/60 hover:text-white transition-colors"
            title="Télécharger"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15V3" />
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>
          
          <button 
            onClick={handleCopy}
            className="p-1.5 text-white/60 hover:text-white transition-colors"
            title={copied ? 'Copié !' : 'Copier'}
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Code avec scrollbar custom */}
      <div className="relative flex bg-[#1a1a1a]">
        {/* Zone de code */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto max-h-40 hide-scrollbar"
        >
          <pre 
            className="overflow-x-auto text-xs p-4 bg-[#1a1a1a]"
            tabIndex={0}
          >
            <code className="text-white whitespace-pre">
              {code}
            </code>
          </pre>
        </div>

        {/* Scrollbar custom - collée au bord droit */}
        {showScrollbar && (
          <div 
            ref={trackRef}
            className="w-[5px] bg-zinc-600/40 cursor-pointer"
            onClick={handleTrackClick}
          >
            {/* Thumb blanc */}
            <div 
              className="w-full bg-white cursor-grab active:cursor-grabbing"
              style={{ 
                height: `${thumbHeight}px`, 
                transform: `translateY(${thumbTop}px)` 
              }}
              onMouseDown={handleThumbMouseDown}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default CodeBlock
