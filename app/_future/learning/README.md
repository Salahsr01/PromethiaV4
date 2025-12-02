# 🧠 Système d'Apprentissage IA - Promethia

Ce module permet à l'IA d'apprendre de ses interactions et de s'améliorer continuellement.

## 🎯 Objectifs

1. **Mémoire contextuelle** : Se souvenir des préférences utilisateur
2. **Apprentissage des patterns** : Identifier ce qui fonctionne bien
3. **Logs intelligents** : Tracer les interactions pour analyse
4. **Amélioration continue** : Affiner les réponses au fil du temps

## 📁 Structure

```
learning/
├── types/
│   └── memory.ts           # Types pour le système de mémoire
├── stores/
│   └── MemoryStore.ts      # Stockage persistant des apprentissages
├── services/
│   ├── LearningService.ts  # Service d'apprentissage
│   ├── PatternDetector.ts  # Détection de patterns
│   └── FeedbackLoop.ts     # Boucle de rétroaction
├── hooks/
│   └── useLearning.ts      # Hook React pour l'apprentissage
└── api/
    ├── learn/route.ts      # API pour enregistrer les apprentissages
    └── recall/route.ts     # API pour récupérer les connaissances
```

## 🔧 Fonctionnalités

### 1. Mémoire des préférences
- Couleurs préférées de l'utilisateur
- Types de graphiques favoris
- Style de réponse souhaité (court/détaillé)

### 2. Apprentissage des corrections
- Quand l'utilisateur reformule, l'IA apprend
- Quand l'utilisateur dit "non", l'IA s'adapte
- Feedback implicite (clics sur suggestions)

### 3. Patterns d'usage
- Heures d'utilisation
- Séquences d'actions fréquentes
- Questions récurrentes

### 4. Amélioration des réponses
- Score de satisfaction par type de réponse
- A/B testing implicite
- Optimisation du prompt

## ⚠️ Status

🔴 NON ACTIVÉ - En développement

