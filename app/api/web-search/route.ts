import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route pour la recherche web
 * Supporte Tavily API (recommandé) et Serper API comme alternatives
 */

interface WebSearchResult {
  title: string
  url: string
  snippet: string
  publishedDate?: string
}

interface WebSearchResponse {
  success: boolean
  query: string
  results: WebSearchResult[]
  totalResults?: number
  error?: string
}

/**
 * Recherche avec Tavily API (recommandé)
 */
async function searchWithTavily(query: string): Promise<WebSearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY
  
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY n\'est pas configurée')
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        include_answer: true,
        include_images: false,
        include_raw_content: false,
        max_results: 10
      })
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      query,
      results: data.results?.map((result: any) => ({
        title: result.title || '',
        url: result.url || '',
        snippet: result.content || result.snippet || '',
        publishedDate: result.published_date
      })) || [],
      totalResults: data.results?.length || 0
    }
  } catch (error: any) {
    throw new Error(`Erreur Tavily: ${error.message}`)
  }
}

/**
 * Recherche avec Serper API (alternative)
 */
async function searchWithSerper(query: string): Promise<WebSearchResponse> {
  const apiKey = process.env.SERPER_API_KEY
  
  if (!apiKey) {
    throw new Error('SERPER_API_KEY n\'est pas configurée')
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({
        q: query,
        num: 10
      })
    })

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      query,
      results: [
        ...(data.organic || []).map((result: any) => ({
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || '',
          publishedDate: result.date
        })),
        ...(data.answerBox ? [{
          title: data.answerBox.title || 'Réponse directe',
          url: data.answerBox.link || '',
          snippet: data.answerBox.answer || data.answerBox.snippet || '',
        }] : [])
      ],
      totalResults: data.organic?.length || 0
    }
  } catch (error: any) {
    throw new Error(`Erreur Serper: ${error.message}`)
  }
}

/**
 * Recherche avec DuckDuckGo (fallback gratuit, sans API key)
 */
async function searchWithDuckDuckGo(query: string): Promise<WebSearchResponse> {
  try {
    // Utiliser l'API DuckDuckGo Instant Answer
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PromethiaBot/1.0)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.statusText}`)
    }

    const data = await response.json()

    const results: WebSearchResult[] = []

    // Ajouter la réponse directe si disponible
    if (data.AbstractText) {
      results.push({
        title: data.Heading || 'Réponse directe',
        url: data.AbstractURL || '',
        snippet: data.AbstractText
      })
    }

    // Ajouter les résultats connexes
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            snippet: topic.Text
          })
        }
      })
    }

    return {
      success: true,
      query,
      results: results.slice(0, 10),
      totalResults: results.length
    }
  } catch (error: any) {
    throw new Error(`Erreur DuckDuckGo: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, provider } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'La requête de recherche est requise' },
        { status: 400 }
      )
    }

    let searchResult: WebSearchResponse

    // Déterminer le provider à utiliser
    const searchProvider = provider || process.env.WEB_SEARCH_PROVIDER || 'tavily'

    try {
      switch (searchProvider.toLowerCase()) {
        case 'tavily':
          searchResult = await searchWithTavily(query)
          break
        case 'serper':
          searchResult = await searchWithSerper(query)
          break
        case 'duckduckgo':
        case 'ddg':
          searchResult = await searchWithDuckDuckGo(query)
          break
        default:
          // Essayer Tavily d'abord, puis fallback sur DuckDuckGo
          try {
            searchResult = await searchWithTavily(query)
          } catch {
            searchResult = await searchWithDuckDuckGo(query)
          }
      }
    } catch (error: any) {
      // Fallback sur DuckDuckGo si les autres échouent
      console.warn(`Recherche avec ${searchProvider} échouée, utilisation de DuckDuckGo:`, error.message)
      try {
        searchResult = await searchWithDuckDuckGo(query)
      } catch (fallbackError: any) {
        return NextResponse.json(
          {
            success: false,
            query,
            results: [],
            error: `Toutes les méthodes de recherche ont échoué: ${fallbackError.message}`
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(searchResult)
  } catch (error: any) {
    console.error('Erreur API Web Search:', error)
    return NextResponse.json(
      {
        success: false,
        query: '',
        results: [],
        error: error.message || 'Erreur lors de la recherche web'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Le paramètre "q" est requis' },
      { status: 400 }
    )
  }

  // Utiliser POST handler avec GET
  const mockRequest = {
    json: async () => ({ query })
  } as NextRequest

  return POST(mockRequest)
}

