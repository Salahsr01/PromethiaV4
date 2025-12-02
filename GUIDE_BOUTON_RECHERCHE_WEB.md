# 🎨 Guide du Bouton de Recherche Web

## ✅ Fonctionnalité Implémentée

Le bouton "Recherché sur internet" change maintenant d'apparence visuelle pour indiquer quand la recherche web est activée :

### État Inactif (par défaut)
- Fond transparent
- Texte gris (`text-neutral-600`)
- Icône normale

### État Actif (recherche web activée)
- **Fond blanc** (`bg-white`)
- **Texte noir** (`text-black`)
- Icône inversée (noir)
- Effet hover : fond gris clair (`hover:bg-gray-100`)

## 🎯 Utilisation

1. **Cliquez sur le bouton** "Recherché sur internet" pour l'activer/désactiver
2. **Quand le bouton est blanc avec du texte noir**, la recherche web est active
3. **Les prochaines requêtes** utiliseront automatiquement la recherche web si elles contiennent des mots-clés pertinents

## 💻 Code Implémenté

### Composant ChatInput

```typescript
// Props ajoutées
interface ChatInputProps {
  // ... autres props
  isWebSearchActive?: boolean
  onWebSearchToggle?: () => void
}

// Bouton avec style conditionnel
<button 
  onClick={onWebSearchToggle}
  className={`p-2 inline-flex items-center gap-2 transition-all ${
    isWebSearchActive 
      ? 'bg-white text-black hover:bg-gray-100' 
      : 'hover:opacity-80'
  }`}
>
  <img 
    src="/internet.svg" 
    alt="" 
    className={`w-3 h-3 ${isWebSearchActive ? 'brightness-0' : ''}`}
  />
  <span className={`text-[10px] sm:text-xs hidden sm:inline ${
    isWebSearchActive ? 'text-black font-medium' : 'text-neutral-600'
  }`}>
    Recherché sur internet
  </span>
</button>
```

### Composant Page

```typescript
// État ajouté
const [isWebSearchActive, setIsWebSearchActive] = useState(false)

// Handler
const handleWebSearchToggle = useCallback(() => {
  setIsWebSearchActive(prev => !prev)
}, [])

// Passage au hook useChat
const { messages, isLoading, ... } = useChat({
  enableWebSearch: isWebSearchActive, // ← Active la recherche web
  // ...
})

// Passage au ChatInput
<ChatInput
  // ...
  isWebSearchActive={isWebSearchActive}
  onWebSearchToggle={handleWebSearchToggle}
/>
```

## 🎨 Styles CSS

Les styles utilisent Tailwind CSS :

- **Actif** : `bg-white text-black hover:bg-gray-100`
- **Inactif** : `hover:opacity-80` (fond transparent par défaut)
- **Icône** : `brightness-0` pour inverser les couleurs quand actif
- **Transition** : `transition-all` pour une animation fluide

## 🔄 Comportement

1. **Clic sur le bouton** → Toggle de l'état `isWebSearchActive`
2. **État actif** → Le bouton devient blanc avec texte noir
3. **Envoi de message** → Si `isWebSearchActive` est `true`, le hook `useChat` passe `enableWebSearch: true` à l'API
4. **API Chat** → Détecte les mots-clés et active la recherche web si nécessaire

## ✨ Résultat Visuel

```
État Inactif:
┌─────────────────────────────┐
│  🌐 Recherché sur internet │  (fond transparent, texte gris)
└─────────────────────────────┘

État Actif:
┌─────────────────────────────┐
│  🌐 Recherché sur internet │  (fond blanc, texte noir)
└─────────────────────────────┘
```

## 🚀 Test

1. Ouvrez votre application
2. Cliquez sur le bouton "Recherché sur internet"
3. Vérifiez que le bouton devient blanc avec du texte noir
4. Envoyez un message avec des mots-clés de recherche (ex: "recherche les actualités...")
5. La recherche web sera automatiquement utilisée !

---

✅ **Le bouton indique maintenant clairement quand la recherche web est activée !**

