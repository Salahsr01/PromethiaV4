import { useState } from 'react'

interface WebSearchResult {
  title: string
  url: string
  snippet: string
  publishedDate?: string
}

interface UseWebSearchReturn {
  search: (query: string) => Promise<WebSearchResult[]>
  results: WebSearchResult[]
  loading: boolean
  error: string | null
}

/**
 * Hook React pour utiliser la recherche web
 */
export function useWebSearch(): UseWebSearchReturn {
  const [results, setResults] = useState<WebSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string): Promise<WebSearchResult[]> => {
    if (!query.trim()) {
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche')
      }

      const data = await response.json()

      if (data.success) {
        setResults(data.results || [])
        return data.results || []
      } else {
        throw new Error(data.error || 'Erreur inconnue')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la recherche web'
      setError(errorMessage)
      setResults([])
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    search,
    results,
    loading,
    error
  }
}

