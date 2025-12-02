import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route pour gérer les connexions MCP (Model Context Protocol)
 * Permet de connecter et gérer des serveurs MCP externes
 */

interface MCPServer {
  id: string
  name: string
  url: string
  type: 'http' | 'stdio' | 'sse'
  enabled: boolean
  config?: Record<string, any>
  capabilities?: string[]
}

interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
}

/**
 * Liste des serveurs MCP configurés
 * En production, stocker dans Supabase ou une base de données
 */
const mcpServers: MCPServer[] = [
  {
    id: 'filesystem',
    name: 'Système de fichiers',
    url: 'stdio://mcp-server-filesystem',
    type: 'stdio',
    enabled: false,
    capabilities: ['read_file', 'write_file', 'list_directory']
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'stdio://mcp-server-github',
    type: 'stdio',
    enabled: false,
    capabilities: ['read_repository', 'create_issue', 'list_pull_requests']
  },
  {
    id: 'database',
    name: 'Base de données',
    url: 'http://localhost:3001/mcp',
    type: 'http',
    enabled: true,
    capabilities: ['query', 'execute', 'schema']
  }
]

/**
 * Obtenir la liste des serveurs MCP
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enabledOnly = searchParams.get('enabled') === 'true'

    let servers = mcpServers

    if (enabledOnly) {
      servers = servers.filter(s => s.enabled)
    }

    return NextResponse.json({
      success: true,
      servers: servers.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        enabled: s.enabled,
        capabilities: s.capabilities || []
      }))
    })
  } catch (error: any) {
    console.error('Erreur MCP GET:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Configurer ou mettre à jour un serveur MCP
 */
export async function POST(request: NextRequest) {
  try {
    const { action, serverId, config } = await request.json()

    switch (action) {
      case 'enable':
        return enableMCPServer(serverId)
      case 'disable':
        return disableMCPServer(serverId)
      case 'register':
        return registerMCPServer(config)
      case 'list_resources':
        return listMCPResources(serverId)
      case 'list_tools':
        return listMCPTools(serverId)
      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Erreur MCP POST:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

async function enableMCPServer(serverId: string) {
  const server = mcpServers.find(s => s.id === serverId)
  if (!server) {
    return NextResponse.json(
      { success: false, error: 'Serveur MCP non trouvé' },
      { status: 404 }
    )
  }

  server.enabled = true

  // En production, sauvegarder dans la base de données
  // await supabase.from('mcp_servers').update({ enabled: true }).eq('id', serverId)

  return NextResponse.json({
    success: true,
    message: `Serveur MCP "${server.name}" activé`,
    server: {
      id: server.id,
      name: server.name,
      enabled: server.enabled
    }
  })
}

async function disableMCPServer(serverId: string) {
  const server = mcpServers.find(s => s.id === serverId)
  if (!server) {
    return NextResponse.json(
      { success: false, error: 'Serveur MCP non trouvé' },
      { status: 404 }
    )
  }

  server.enabled = false

  return NextResponse.json({
    success: true,
    message: `Serveur MCP "${server.name}" désactivé`,
    server: {
      id: server.id,
      name: server.name,
      enabled: server.enabled
    }
  })
}

async function registerMCPServer(config: Partial<MCPServer>) {
  if (!config.id || !config.name || !config.url) {
    return NextResponse.json(
      { success: false, error: 'id, name et url sont requis' },
      { status: 400 }
    )
  }

  const newServer: MCPServer = {
    id: config.id,
    name: config.name,
    url: config.url,
    type: config.type || 'http',
    enabled: config.enabled ?? true,
    config: config.config,
    capabilities: config.capabilities || []
  }

  mcpServers.push(newServer)

  return NextResponse.json({
    success: true,
    message: `Serveur MCP "${newServer.name}" enregistré`,
    server: newServer
  })
}

async function listMCPResources(serverId: string) {
  const server = mcpServers.find(s => s.id === serverId)
  if (!server || !server.enabled) {
    return NextResponse.json(
      { success: false, error: 'Serveur MCP non trouvé ou désactivé' },
      { status: 404 }
    )
  }

  // En production, appeler le serveur MCP réel
  // Pour l'instant, retourner des exemples
  const resources: MCPResource[] = []

  if (server.id === 'filesystem') {
    resources.push(
      {
        uri: 'file:///documents',
        name: 'Documents',
        description: 'Dossier de documents',
        mimeType: 'application/directory'
      },
      {
        uri: 'file:///exports',
        name: 'Exports',
        description: 'Dossier d\'exports',
        mimeType: 'application/directory'
      }
    )
  }

  return NextResponse.json({
    success: true,
    serverId,
    resources
  })
}

async function listMCPTools(serverId: string) {
  const server = mcpServers.find(s => s.id === serverId)
  if (!server || !server.enabled) {
    return NextResponse.json(
      { success: false, error: 'Serveur MCP non trouvé ou désactivé' },
      { status: 404 }
    )
  }

  // En production, appeler le serveur MCP réel
  const tools: MCPTool[] = []

  if (server.capabilities?.includes('read_file')) {
    tools.push({
      name: 'read_file',
      description: 'Lire le contenu d\'un fichier',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Chemin du fichier' }
        },
        required: ['path']
      }
    })
  }

  if (server.capabilities?.includes('write_file')) {
    tools.push({
      name: 'write_file',
      description: 'Écrire dans un fichier',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Chemin du fichier' },
          content: { type: 'string', description: 'Contenu à écrire' }
        },
        required: ['path', 'content']
      }
    })
  }

  return NextResponse.json({
    success: true,
    serverId,
    tools
  })
}

