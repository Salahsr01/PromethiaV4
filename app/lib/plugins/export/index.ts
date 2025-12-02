/**
 * Plugin Export - Export de données et rapports
 * 
 * Permet d'exporter les graphiques et données en PDF, CSV, Excel, etc.
 */

import { Plugin, AICommand } from '../plugin'

const exportCommands: AICommand[] = [
  {
    name: 'exporter-pdf',
    description: 'Exporte le dashboard ou un graphique en PDF',
    parameters: [
      { name: 'target', type: 'string', description: 'dashboard ou id du graphique' },
      { name: 'includeAnalysis', type: 'boolean', description: 'Inclure l\'analyse IA' }
    ],
    execute: async (args, context) => {
      const { target = 'dashboard', includeAnalysis = true } = args
      
      context.log.info(`Export PDF: ${target}`)
      
      // En production, générer le PDF
      // Utiliser une lib comme jsPDF ou puppeteer côté serveur
      
      return {
        response: `📄 Export PDF en cours... Le fichier sera téléchargé automatiquement.`
      }
    }
  },
  {
    name: 'exporter-csv',
    description: 'Exporte les données en CSV',
    parameters: [
      { name: 'seriesId', type: 'string', description: 'ID de la série de données' },
      { name: 'dateRange', type: 'string', description: 'Période (ex: "30j", "1m", "1a")' }
    ],
    execute: async (args, context) => {
      const { seriesId, dateRange } = args
      
      // Récupérer les données
      const data = await context.getData(seriesId || 'burnrate')
      
      if (data.length === 0) {
        return { response: 'Aucune donnée à exporter.' }
      }
      
      // Générer le CSV
      const headers = Object.keys(data[0]).join(',')
      const rows = data.map(row => Object.values(row).join(','))
      const csv = [headers, ...rows].join('\n')
      
      // En production, déclencher le téléchargement
      context.log.info(`CSV généré: ${data.length} lignes`)
      
      return {
        response: `📊 Export CSV prêt! ${data.length} lignes de données exportées.`
      }
    }
  },
  {
    name: 'exporter-excel',
    description: 'Exporte les données en Excel avec formatage',
    parameters: [
      { name: 'includeCharts', type: 'boolean', description: 'Inclure les graphiques' },
      { name: 'includeAnalysis', type: 'boolean', description: 'Inclure l\'analyse' }
    ],
    execute: async (args, context) => {
      const { includeCharts = true, includeAnalysis = true } = args
      
      context.log.info('Export Excel avec options:', { includeCharts, includeAnalysis })
      
      // En production, utiliser une lib comme exceljs
      
      return {
        response: `📗 Export Excel en cours... Le fichier inclura ${includeCharts ? 'les graphiques' : 'uniquement les données'}${includeAnalysis ? ' et l\'analyse IA' : ''}.`
      }
    }
  },
  {
    name: 'rapport-automatique',
    description: 'Configure un rapport automatique périodique',
    parameters: [
      { name: 'frequency', type: 'string', description: 'quotidien, hebdomadaire, mensuel', required: true },
      { name: 'format', type: 'string', description: 'pdf, excel, email' },
      { name: 'recipients', type: 'array', description: 'Liste des destinataires email' }
    ],
    execute: async (args, context) => {
      const { frequency, format = 'pdf', recipients = [] } = args
      
      // Sauvegarder la configuration du rapport
      const reports = await context.storage.get('scheduled_reports') || []
      reports.push({
        id: Date.now().toString(),
        frequency,
        format,
        recipients,
        createdAt: new Date().toISOString(),
        active: true,
        lastRun: null,
        nextRun: calculateNextRun(frequency)
      })
      await context.storage.set('scheduled_reports', reports)
      
      return {
        response: `📅 Rapport ${frequency} configuré! Format: ${format.toUpperCase()}${recipients.length > 0 ? `, envoyé à ${recipients.length} destinataire(s)` : ''}`
      }
    }
  },
  {
    name: 'partager',
    description: 'Génère un lien de partage pour le dashboard',
    parameters: [
      { name: 'expiration', type: 'string', description: 'Durée de validité (ex: 1h, 24h, 7j)' },
      { name: 'readOnly', type: 'boolean', description: 'Lecture seule' }
    ],
    execute: async (args, context) => {
      const { expiration = '24h', readOnly = true } = args
      
      // Générer un token de partage
      const shareToken = generateShareToken()
      
      // Sauvegarder le lien
      await context.storage.set(`share:${shareToken}`, {
        createdAt: new Date().toISOString(),
        expiration,
        readOnly,
        views: 0
      })
      
      // En production, utiliser l'URL réelle
      const shareUrl = `https://promethia.app/share/${shareToken}`
      
      return {
        response: `🔗 Lien de partage créé!\n\n${shareUrl}\n\nValide pendant ${expiration}${readOnly ? ' (lecture seule)' : ''}`
      }
    }
  }
]

// Helpers
function calculateNextRun(frequency: string): string {
  const now = new Date()
  
  switch (frequency) {
    case 'quotidien':
      now.setDate(now.getDate() + 1)
      now.setHours(8, 0, 0, 0)
      break
    case 'hebdomadaire':
      now.setDate(now.getDate() + 7)
      now.setHours(8, 0, 0, 0)
      break
    case 'mensuel':
      now.setMonth(now.getMonth() + 1)
      now.setDate(1)
      now.setHours(8, 0, 0, 0)
      break
  }
  
  return now.toISOString()
}

function generateShareToken(): string {
  return `share_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
}

export const exportPlugin: Plugin = {
  metadata: {
    id: 'export-plugin',
    name: 'Export & Partage',
    version: '1.0.0',
    description: 'Exportez vos données en PDF, CSV, Excel et partagez vos dashboards',
    author: 'Promethia Team',
    category: 'utility',
    icon: '📤',
    keywords: ['export', 'pdf', 'csv', 'excel', 'share', 'report']
  },
  
  commands: exportCommands,
  
  async onLoad(context) {
    context.log.info('Plugin Export chargé')
    
    // Vérifier les rapports programmés
    const reports = await context.storage.get('scheduled_reports') || []
    const activeReports = reports.filter((r: any) => r.active)
    
    if (activeReports.length > 0) {
      context.log.info(`${activeReports.length} rapport(s) automatique(s) actif(s)`)
    }
  },
  
  async onUnload() {
    console.log('Plugin Export déchargé')
  }
}

export default exportPlugin

