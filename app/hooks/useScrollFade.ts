'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface ScrollFadeState {
  showTop: boolean
  showBottom: boolean
  showLeft: boolean
  showRight: boolean
}

export function useScrollFade(direction: 'vertical' | 'horizontal' | 'both' = 'vertical') {
  const [fadeState, setFadeState] = useState<ScrollFadeState>({
    showTop: false,
    showBottom: false,
    showLeft: false,
    showRight: false
  })
  
  const scrollRef = useRef<HTMLDivElement>(null)

  const updateFadeState = useCallback(() => {
    if (!scrollRef.current) return

    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = scrollRef.current

    if (direction === 'vertical' || direction === 'both') {
      setFadeState(prev => ({
        ...prev,
        showTop: scrollTop > 0,
        showBottom: scrollTop < scrollHeight - clientHeight - 1
      }))
    }

    if (direction === 'horizontal' || direction === 'both') {
      setFadeState(prev => ({
        ...prev,
        showLeft: scrollLeft > 0,
        showRight: scrollLeft < scrollWidth - clientWidth - 1
      }))
    }
  }, [direction])

  const handleScroll = useCallback(() => {
    updateFadeState()
  }, [updateFadeState])

  // Initial check
  useEffect(() => {
    updateFadeState()
  }, [updateFadeState])

  return {
    scrollRef,
    fadeState,
    handleScroll,
    updateFadeState
  }
}

