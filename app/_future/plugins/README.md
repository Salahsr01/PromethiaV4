# 🔌 Système de Plugins - Promethia

Architecture extensible permettant d'ajouter des fonctionnalités sans modifier le code core.

## 🎯 Concept

Les plugins permettent d'étendre Promethia avec:
- Nouvelles sources de données
- Nouveaux types de visualisations
- Intégrations externes (Slack, Email, Webhooks)
- Commandes IA personnalisées
- Thèmes et personnalisations

## 📁 Structure

```
plugins/
├── types/
│   └── plugin.ts           # Types et interfaces
├── core/
│   ├── PluginManager.ts    # Gestionnaire de plugins
│   ├── PluginRegistry.ts   # Registre des plugins
│   └── PluginSandbox.ts    # Sandbox d'exécution sécurisée
├── builtin/
│   ├── slack/              # Plugin Slack
│   ├── email/              # Plugin Email
│   ├── webhook/            # Plugin Webhooks
│   └── export/             # Plugin Export (PDF, CSV)
└── api/
    └── plugins/route.ts    # API de gestion des plugins
```

## 🔧 Créer un Plugin

```typescript
import { Plugin, PluginContext } from '@/app/_future/plugins/types/plugin'

const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'Mon Plugin',
  version: '1.0.0',
  
  async onLoad(context: PluginContext) {
    // Initialisation
  },
  
  async onUnload() {
    // Nettoyage
  },
  
  commands: [
    {
      name: 'ma-commande',
      description: 'Description de ma commande',
      execute: async (args, context) => {
        // Logique
      }
    }
  ]
}
```

## ⚠️ Status

🔴 NON ACTIVÉ - En développement

