# Configuration des Clés API

## 🔑 Clé API Tavily

Votre clé API Tavily a été configurée. Pour l'utiliser, ajoutez-la dans votre fichier `.env.local` :

```bash
# Recherche Web - Tavily
WEB_SEARCH_PROVIDER=tavily
TAVILY_API_KEY=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
```

## 📝 Instructions

1. **Créez ou modifiez le fichier `.env.local`** à la racine du projet :
   ```bash
   cp env.example .env.local
   ```

2. **Ajoutez votre clé API Tavily** dans `.env.local` :
   ```env
   TAVILY_API_KEY=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
   WEB_SEARCH_PROVIDER=tavily
   ```

3. **Redémarrez votre serveur de développement** pour que les changements prennent effet :
   ```bash
   npm run dev
   ```

## ✅ Test de la Recherche Web

Une fois configuré, vous pouvez tester la recherche web :

```bash
# Via curl
curl -X POST http://localhost:3000/api/web-search \
  -H "Content-Type: application/json" \
  -d '{"query": "actualités technologie 2024"}'
```

Ou directement dans votre application en utilisant le hook `useWebSearch` :

```typescript
import { useWebSearch } from '@/app/hooks/useWebSearch'

function MyComponent() {
  const { search, results, loading } = useWebSearch()
  
  const handleSearch = async () => {
    await search('votre recherche')
  }
  
  return (
    <div>
      {results.map((result, i) => (
        <div key={i}>
          <h3>{result.title}</h3>
          <p>{result.snippet}</p>
          <a href={result.url}>Lire plus</a>
        </div>
      ))}
    </div>
  )
}
```

## 🔒 Sécurité

⚠️ **Important** : Ne commitez jamais votre fichier `.env.local` dans Git. Il est déjà dans `.gitignore`.

Votre clé API est confidentielle et ne doit être partagée avec personne.

