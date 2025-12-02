# 🔗 Guide des Sources Web (Style ChatGPT)

## ✅ Fonctionnalité Implémentée

Quand l'IA effectue une recherche web, les sources sont maintenant affichées directement sous la réponse, comme sur ChatGPT, avec :

1. **Citations compactes** : Pills cliquables avec les titres des sources
2. **Bouton "Sources"** : Pour voir toutes les sources détaillées
3. **Liste détaillée** : Expandable avec extraits, URLs et dates

## 🎨 Design

### Affichage Compact (par défaut)
```
[Fédération Française de Football] [Source 2] [Source 3 +2]
[🔗 Sources ▼]
```

### Affichage Détaillé (après clic)
```
[1] Fédération Française de Football
    Extrait de la page...
    fff.fr • 15 janvier 2024

[2] Source 2
    ...
```

## 💻 Code Implémenté

### Composant WebSources

```typescript
// app/components/ui/WebSources.tsx
<WebSources sources={message.webSources} />
```

### Type Message Étendu

```typescript
export interface Message {
  role: 'user' | 'assistant'
  content: string
  webSources?: WebSource[]  // ← Nouveau
}

export interface WebSource {
  title: string
  url: string
  snippet: string
  publishedDate?: string
}
```

### Intégration dans MessageBubble

Les sources sont automatiquement affichées après le contenu du message si `webSources` existe.

## 🔄 Flux de Données

1. **Utilisateur envoie un message** avec recherche web activée
2. **API Chat** détecte les mots-clés ou utilise `enableWebSearch`
3. **Recherche web** effectuée via `/api/web-search`
4. **Résultats** inclus dans la réponse de l'API
5. **Hook useChat** stocke les sources dans le message
6. **MessageBubble** affiche les sources automatiquement

## 📊 Structure des Données

```typescript
// Réponse de l'API /api/chat
{
  message: "Réponse de l'IA...",
  webSearchResults: [
    {
      title: "Fédération Française de Football",
      url: "https://www.fff.fr/...",
      snippet: "Extrait de la page...",
      publishedDate: "2024-01-15"
    },
    // ... autres sources
  ]
}
```

## 🎯 Utilisation

### Activation Automatique

La recherche web s'active automatiquement avec des mots-clés :
- "recherche", "cherche", "trouve"
- "informations sur", "actualité"
- "qu'est-ce que", "définition"
- etc.

### Activation Manuelle

```typescript
const { sendMessage } = useChat({
  enableWebSearch: true  // Active pour toutes les requêtes
})
```

## ✨ Fonctionnalités

### Citations Compactes
- **Clic** : Ouvre la source dans un nouvel onglet
- **Hover** : Effet visuel pour indiquer l'interactivité
- **Truncate** : Titres longs sont tronqués avec `...`
- **Compteur** : Affiche "+2" si plus de 3 sources

### Bouton Sources
- **Clic** : Expand/collapse la liste détaillée
- **Icône** : Change de direction (▼/▲)
- **Style** : Fond semi-transparent avec bordure

### Liste Détaillée
- **Numérotation** : [1], [2], [3]...
- **Titre cliquable** : Ouvre la source
- **Extrait** : 2 lignes max (line-clamp-2)
- **Métadonnées** : Hostname et date si disponible
- **Icône externe** : Indique le lien externe

## 🎨 Styles CSS

```css
/* Citations */
bg-white/10 hover:bg-white/15
border-white/20 hover:border-white/30
rounded-full

/* Bouton Sources */
bg-white/10 hover:bg-white/15
rounded-full

/* Liste détaillée */
bg-white/5 border-white/10
hover:bg-white/5
```

## 🔍 Exemple Visuel

```
┌─────────────────────────────────────────┐
│ Réponse de l'IA avec recherche web... │
│                                         │
│ [Fédération Française de Football]     │
│ [parisfans.fr] [+2]                    │
│                                         │
│ [🔗 Sources ▼]                         │
└─────────────────────────────────────────┘

Après clic sur "Sources" :

┌─────────────────────────────────────────┐
│ [1] Fédération Française de Football    │
│     Extrait de la page...               │
│     fff.fr • 15 jan 2024              │
│                                         │
│ [2] parisfans.fr                        │
│     Coupe de France – Le Tirage...     │
│     parisfans.fr • 12 jan 2024        │
└─────────────────────────────────────────┘
```

## 🚀 Test

1. Activez la recherche web (bouton blanc)
2. Envoyez un message avec des mots-clés de recherche
3. Vérifiez que les sources apparaissent sous la réponse
4. Cliquez sur une citation pour ouvrir la source
5. Cliquez sur "Sources" pour voir la liste détaillée

---

✅ **Les sources web sont maintenant affichées comme sur ChatGPT !**

