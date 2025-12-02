# Nouvelles Fonctionnalités Promethia

Ce document décrit les nouvelles fonctionnalités ajoutées à Promethia.

## 🌐 Recherche Web

La fonctionnalité de recherche web permet à l'IA d'enrichir ses réponses avec des informations à jour depuis Internet.

### Configuration

1. **Tavily API** (recommandé)
   - Obtenez une clé API sur [tavily.com](https://tavily.com/)
   - Ajoutez `TAVILY_API_KEY` dans votre `.env.local`

2. **Serper API** (alternative)
   - Obtenez une clé API sur [serper.dev](https://serper.dev/)
   - Ajoutez `SERPER_API_KEY` dans votre `.env.local`

3. **DuckDuckGo** (fallback gratuit)
   - Aucune clé API requise
   - Fonctionne automatiquement si les autres providers ne sont pas configurés

### Utilisation

La recherche web s'active automatiquement quand vous utilisez des mots-clés comme :
- "recherche", "cherche", "trouve"
- "informations sur", "actualité", "news"
- "qu'est-ce que", "définition", "explique"
- "comment ça marche", "quand", "où", "pourquoi"

Vous pouvez aussi activer manuellement la recherche web en passant `enableWebSearch: true` dans votre requête au chat API.

### API

```typescript
// POST /api/web-search
{
  "query": "votre recherche",
  "provider": "tavily" // optionnel: tavily, serper, duckduckgo
}
```

## 🔌 Connexions MCP (Model Context Protocol)

Le système MCP permet de connecter et gérer des serveurs MCP externes pour étendre les capacités de Promethia.

### Serveurs MCP disponibles

- **Système de fichiers** : Lecture/écriture de fichiers
- **GitHub** : Gestion de dépôts, issues, pull requests
- **Base de données** : Requêtes et exécution SQL

### Configuration

```typescript
// POST /api/mcp
{
  "action": "register",
  "serverId": "mon-serveur",
  "config": {
    "name": "Mon Serveur MCP",
    "url": "http://localhost:3001/mcp",
    "type": "http",
    "capabilities": ["read", "write"]
  }
}
```

### Actions disponibles

- `enable` : Activer un serveur MCP
- `disable` : Désactiver un serveur MCP
- `register` : Enregistrer un nouveau serveur MCP
- `list_resources` : Lister les ressources disponibles
- `list_tools` : Lister les outils disponibles

### API

```typescript
// GET /api/mcp?enabled=true
// Liste tous les serveurs MCP activés

// POST /api/mcp
{
  "action": "enable",
  "serverId": "filesystem"
}
```

## 🏦 Connexions Bancaires (Plaid)

Intégration avec Plaid pour connecter et synchroniser les comptes bancaires.

### Configuration

1. Créez un compte sur [Plaid Dashboard](https://dashboard.plaid.com/)
2. Obtenez vos identifiants (Client ID et Secret)
3. Ajoutez dans votre `.env.local` :
   ```
   PLAID_CLIENT_ID=votre-client-id
   PLAID_SECRET=votre-secret
   PLAID_ENV=sandbox
   ```

### Fonctionnalités

- **Connexion de comptes** : Connectez vos comptes bancaires via Plaid Link
- **Synchronisation** : Synchronisez automatiquement les transactions
- **Historique** : Consultez l'historique des transactions
- **Multi-comptes** : Gérez plusieurs comptes bancaires

### API

```typescript
// Créer un Link Token pour initialiser la connexion
POST /api/banking
{
  "action": "create_link_token",
  "userId": "user-id"
}

// Échanger le public token
POST /api/banking
{
  "action": "exchange_public_token",
  "publicToken": "public-token-from-plaid",
  "userId": "user-id"
}

// Récupérer les comptes
POST /api/banking
{
  "action": "get_accounts",
  "userId": "user-id"
}

// Récupérer les transactions
POST /api/banking
{
  "action": "get_transactions",
  "userId": "user-id",
  "accountId": "account-id", // optionnel
  "startDate": "2024-01-01", // optionnel
  "endDate": "2024-12-31" // optionnel
}

// Synchroniser les comptes
POST /api/banking
{
  "action": "sync_accounts",
  "userId": "user-id"
}
```

### Tables de base de données

Les comptes bancaires et transactions sont stockés dans Supabase :
- `bank_accounts` : Comptes bancaires connectés
- `bank_transactions` : Transactions bancaires

## 📄 Génération de PDF de Factures

Génération automatique de factures au format PDF.

### Fonctionnalités

- Génération de factures professionnelles
- Support de plusieurs lignes d'articles
- Calcul automatique des taxes
- Design personnalisable
- Export direct en PDF

### API

```typescript
// Générer un PDF depuis une facture existante
POST /api/generate-invoice-pdf
{
  "invoiceId": "invoice-uuid"
}

// Générer un PDF avec des données personnalisées
POST /api/generate-invoice-pdf
{
  "invoiceData": {
    "invoiceNumber": "FAC-2024-001",
    "date": "2024-01-15",
    "dueDate": "2024-02-15",
    "client": {
      "name": "Client Exemple",
      "address": "123 Rue Exemple",
      "email": "client@example.com"
    },
    "items": [
      {
        "description": "Service de consultation",
        "quantity": 10,
        "unitPrice": 100,
        "total": 1000
      }
    ],
    "subtotal": 1000,
    "tax": 200,
    "taxRate": 20,
    "total": 1200,
    "notes": "Merci pour votre confiance"
  },
  "method": "puppeteer" // ou "simple"
}

// Télécharger directement le PDF
GET /api/generate-invoice-pdf?id=invoice-uuid
```

### Installation Puppeteer (optionnel)

Pour un rendu PDF avancé avec HTML/CSS :

```bash
npm install puppeteer
```

Sans Puppeteer, un PDF basique sera généré.

### Tables de base de données

Les factures sont stockées dans Supabase :
- `invoices` : Factures créées

## 📋 Migration de la Base de Données

Exécutez le script SQL mis à jour pour créer les nouvelles tables :

```sql
-- Le fichier supabase/schema.sql a été mis à jour avec :
-- - bank_accounts
-- - bank_transactions
-- - invoices
-- - mcp_servers
```

## 🔒 Sécurité

- **Tokens bancaires** : Les access tokens Plaid doivent être chiffrés en production
- **RLS** : Row Level Security activé sur toutes les nouvelles tables
- **API Keys** : Stockez toutes les clés API dans `.env.local` (jamais dans le code)

## 🚀 Prochaines Étapes

1. Configurez vos clés API dans `.env.local`
2. Exécutez les migrations SQL dans Supabase
3. Testez chaque fonctionnalité via les APIs
4. Intégrez-les dans votre interface utilisateur

## 📚 Ressources

- [Tavily Documentation](https://docs.tavily.com/)
- [Plaid Documentation](https://plaid.com/docs/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Puppeteer Documentation](https://pptr.dev/)

