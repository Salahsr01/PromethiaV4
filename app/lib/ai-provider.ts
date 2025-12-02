/**
 * AI Provider abstraction layer
 * Supports Claude (Anthropic) as primary and Ollama as fallback
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  provider: 'claude' | 'ollama'
}

interface AIProviderConfig {
  provider: 'claude' | 'ollama'
  model: string
  apiKey?: string
  baseUrl?: string
}

const defaultConfig: AIProviderConfig = {
  provider: 'claude',
  model: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
}

async function callClaude(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
  if (!defaultConfig.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const formattedMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role,
    content: m.content
  }))

  const systemMessage = systemPrompt || messages.find(m => m.role === 'system')?.content

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': defaultConfig.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: defaultConfig.model,
      max_tokens: 4096,
      system: systemMessage || 'Tu es un assistant IA professionnel et utile. Tu réponds en français de manière claire et concise.',
      messages: formattedMessages
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  
  return {
    content: data.content[0].text,
    model: defaultConfig.model,
    provider: 'claude'
  }
}

async function callOllama(messages: AIMessage[], model?: string): Promise<AIResponse> {
  const ollamaModel = model || 'mistral:latest'
  
  const response = await fetch(`${defaultConfig.baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: ollamaModel,
      messages: messages,
      stream: false
    })
  })

  if (!response.ok) {
    throw new Error('Ollama API error')
  }

  const data = await response.json()
  let content = data.message.content.trim()
  
  // Remove <think> tags if present (for DeepSeek-R1)
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

  return {
    content,
    model: ollamaModel,
    provider: 'ollama'
  }
}

export async function generateAIResponse(
  messages: AIMessage[],
  options?: {
    systemPrompt?: string
    model?: string
    forceProvider?: 'claude' | 'ollama'
  }
): Promise<AIResponse> {
  const provider = options?.forceProvider || defaultConfig.provider

  try {
    if (provider === 'claude') {
      return await callClaude(messages, options?.systemPrompt)
    } else {
      return await callOllama(messages, options?.model)
    }
  } catch (error) {
    // Fallback to Ollama if Claude fails
    if (provider === 'claude') {
      console.warn('Claude API failed, falling back to Ollama:', error)
      try {
        return await callOllama(messages, options?.model)
      } catch (ollamaError) {
        throw new Error('Both Claude and Ollama failed')
      }
    }
    throw error
  }
}

export async function generateJSON<T>(
  messages: AIMessage[],
  options?: {
    systemPrompt?: string
    model?: string
  }
): Promise<T> {
  const response = await generateAIResponse(messages, options)
  
  try {
    return JSON.parse(response.content)
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('Failed to parse JSON from AI response')
  }
}

