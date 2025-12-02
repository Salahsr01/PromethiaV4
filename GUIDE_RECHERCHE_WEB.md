# 🌐 Guide d'Utilisation de la Recherche Web

Votre clé API Tavily a été configurée avec succès ! La fonctionnalité de recherche web est maintenant active.

## ✅ Configuration Actuelle

- **Provider** : Tavily
- **Clé API** : Configurée dans `.env.local`
- **Status** : ✅ Prêt à l'emploi

## 🚀 Utilisation

### 1. Dans le Chat (Automatique)

La recherche web s'active automatiquement quand vous utilisez des mots-clés comme :
- "recherche", "cherche", "trouve"
- "informations sur", "actualité", "news"
- "qu'est-ce que", "définition", "explique"
- "comment ça marche", "quand", "où", "pourquoi"

**Exemple** :
```
Vous : "Recherche les dernières actualités sur l'intelligence artificielle"
```

L'IA va automatiquement rechercher sur le web et enrichir sa réponse avec les résultats.

### 2. Activation Manuelle dans le Code

```typescript
import { useChat } from '@/app/hooks/useChat'

function ChatComponent() {
  const { sendMessage } = useChat({
    enableWebSearch: true // Active la recherche web pour toutes les requêtes
  })
  
  // ...
}
```

### 3. Utilisation Directe de l'API

```typescript
// Recherche web directe
const response = await fetch('/api/web-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'votre recherche ici',
    provider: 'tavily' // optionnel
  })
})

const data = await response.json()
console.log(data.results) // Tableau de résultats
```

### 4. Utilisation avec le Hook React

```typescript
import { useWebSearch } from '@/app/hooks/useWebSearch'

function SearchComponent() {
  const { search, results, loading, error } = useWebSearch()
  
  const handleSearch = async () => {
    await search('actualités technologie 2024')
  }
  
  return (
    <div>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Recherche...' : 'Rechercher'}
      </button>
      
      {error && <p className="error">{error}</p>}
      
      {results.map((result, i) => (
        <div key={i} className="result">
          <h3>{result.title}</h3>
          <p>{result.snippet}</p>
          <a href={result.url} target="_blank" rel="noopener noreferrer">
            Lire l'article →
          </a>
        </div>
      ))}
    </div>
  )
}
```

## 📊 Structure des Résultats

Chaque résultat de recherche contient :

```typescript
{
  title: string        // Titre de la page
  url: string          // URL de la source
  snippet: string      // Extrait du contenu
  publishedDate?: string // Date de publication (si disponible)
}
```

## 🔧 Test Rapide

Testez la recherche web avec cette commande :

```bash
curl -X POST http://localhost:3000/api/web-search \
  -H "Content-Type: application/json" \
  -d '{"query": "actualités intelligence artificielle 2024"}'
```

## 💡 Exemples d'Utilisation

### Exemple 1 : Recherche d'informations
```
Utilisateur : "Qu'est-ce que le Machine Learning ?"
→ L'IA recherche sur le web et fournit une réponse enrichie
```

### Exemple 2 : Actualités
```
Utilisateur : "Quelles sont les dernières nouvelles sur React 19 ?"
→ L'IA recherche les actualités récentes et les résume
```

### Exemple 3 : Définitions et explications
```
Utilisateur : "Explique-moi comment fonctionne l'API REST"
→ L'IA recherche des ressources et explique avec des sources
```

## 🎯 Intégration dans le Chatbox

Pour activer la recherche web dans votre chatbox existant, modifiez votre composant :

```typescript
// Dans votre composant de chat
import { useChat } from '@/app/hooks/useChat'

const { sendMessage, messages } = useChat({
  enableWebSearch: true, // Active la recherche web
  onAssistantMessage: (message) => {
    console.log('Réponse avec recherche web:', message)
  }
})
```

## 🔍 Résultats dans les Réponses du Chat

Quand la recherche web est utilisée, la réponse du chat inclut :

```json
{
  "message": "Réponse de l'IA enrichie avec les résultats web...",
  "hasWebSearch": true,
  "webSearchResults": [
    {
      "title": "Titre de l'article",
      "url": "https://example.com",
      "snippet": "Extrait..."
    }
  ]
}
```

## ⚙️ Configuration Avancée

### Changer de Provider

Dans `.env.local` :

```env
# Utiliser Serper au lieu de Tavily
WEB_SEARCH_PROVIDER=serper
SERPER_API_KEY=votre-clé-serper

# Ou utiliser DuckDuckGo (gratuit, pas de clé nécessaire)
WEB_SEARCH_PROVIDER=duckduckgo
```

### Provider par Requête

```typescript
const response = await fetch('/api/web-search', {
  method: 'POST',
  body: JSON.stringify({
    query: 'votre recherche',
    provider: 'serper' // Override le provider par défaut
  })
})
```

## 🐛 Dépannage

### La recherche web ne fonctionne pas

1. **Vérifiez votre clé API** :
   ```bash
   grep TAVILY_API_KEY .env.local
   ```

2. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

3. **Vérifiez les logs** :
   - Les erreurs apparaissent dans la console du serveur
   - Vérifiez que la clé API est valide sur [Tavily Dashboard](https://app.tavily.com/)

### Erreur "TAVILY_API_KEY n'est pas configurée"

- Vérifiez que `.env.local` existe et contient `TAVILY_API_KEY`
- Redémarrez le serveur après modification de `.env.local`

## 📚 Ressources

- [Documentation Tavily](https://docs.tavily.com/)
- [Dashboard Tavily](https://app.tavily.com/)
- [API Reference](https://docs.tavily.com/api-reference)

---

✅ **Votre recherche web est maintenant configurée et prête à l'emploi !**

