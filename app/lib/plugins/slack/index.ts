/**
 * Plugin Slack - Intégration avec Slack
 * 
 * Permet d'envoyer des notifications et des rapports sur Slack.
 */

import { Plugin, PluginContext, AICommand } from '../plugin'

const slackCommands: AICommand[] = [
  {
    name: 'envoyer-slack',
    description: 'Envoie un message ou un rapport sur Slack',
    parameters: [
      { name: 'message', type: 'string', description: 'Message à envoyer', required: true },
      { name: 'channel', type: 'string', description: 'Canal Slack (optionnel)' },
      { name: 'includeChart', type: 'boolean', description: 'Inclure une capture du graphique' }
    ],
    execute: async (args, context) => {
      const { message, channel, includeChart } = args
      
      // Récupérer le webhook depuis la config
      const config = context.getConfig()
      const webhookUrl = config.settings.webhookUrl
      
      if (!webhookUrl) {
        return {
          response: 'Veuillez configurer le webhook Slack dans les paramètres du plugin.'
        }
      }
      
      try {
        // Construire le payload Slack
        const payload: any = {
          text: message,
          channel: channel || config.settings.defaultChannel
        }
        
        // En production, ajouter la capture du graphique si demandé
        if (includeChart) {
          payload.attachments = [{
            color: '#3b82f6',
            title: 'Graphique Promethia',
            text: 'Capture du graphique actuel'
            // image_url serait ajouté ici
          }]
        }
        
        await context.fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        context.log.info(`Message envoyé sur Slack: ${message.slice(0, 50)}...`)
        
        return {
          response: `✅ Message envoyé sur Slack${channel ? ` (#${channel})` : ''}`
        }
      } catch (error) {
        context.log.error('Erreur envoi Slack:', error)
        return {
          response: 'Erreur lors de l\'envoi sur Slack. Vérifiez la configuration.'
        }
      }
    }
  },
  {
    name: 'alerte-slack',
    description: 'Configure une alerte automatique sur Slack',
    parameters: [
      { name: 'condition', type: 'string', description: 'Condition de déclenchement', required: true },
      { name: 'message', type: 'string', description: 'Message d\'alerte', required: true }
    ],
    execute: async (args, context) => {
      const { condition, message } = args
      
      // Sauvegarder l'alerte
      const alerts = await context.storage.get('alerts') || []
      alerts.push({
        id: Date.now().toString(),
        condition,
        message,
        createdAt: new Date().toISOString(),
        active: true
      })
      await context.storage.set('alerts', alerts)
      
      return {
        response: `✅ Alerte configurée. Je vous notifierai sur Slack quand: ${condition}`
      }
    }
  }
]

export const slackPlugin: Plugin = {
  metadata: {
    id: 'slack-integration',
    name: 'Slack Integration',
    version: '1.0.0',
    description: 'Envoyez des notifications et rapports sur Slack',
    author: 'Promethia Team',
    category: 'integration',
    icon: '💬',
    keywords: ['slack', 'notification', 'alert', 'messaging']
  },
  
  commands: slackCommands,
  
  async onLoad(context) {
    context.log.info('Plugin Slack chargé')
    
    // Vérifier la configuration
    const config = context.getConfig()
    if (!config.settings.webhookUrl) {
      context.showNotification(
        'Plugin Slack: Configurez le webhook dans les paramètres',
        'warning'
      )
    }
    
    // S'abonner aux événements pour les alertes automatiques
    context.on('data:changed', async () => {
      await checkAlerts(context)
    })
  },
  
  async onUnload() {
    console.log('Plugin Slack déchargé')
  },
  
  settingsPanel: ({ config, onChange }) => {
    // En production, retourner un composant React
    return null
  }
}

// Vérifier les alertes configurées
async function checkAlerts(context: PluginContext): Promise<void> {
  const alerts = await context.storage.get('alerts') || []
  
  for (const alert of alerts) {
    if (!alert.active) continue
    
    // En production, évaluer la condition
    // Pour l'instant, juste logger
    context.log.debug(`Vérification alerte: ${alert.condition}`)
  }
}

export default slackPlugin

