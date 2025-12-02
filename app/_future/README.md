# 🚀 Future Features - Dashboard Dynamique

Ce dossier contient les fonctionnalités futures pour le tableau de bord dynamique.

## 🎯 Objectif

Permettre à l'IA de :
- Créer/supprimer des widgets (box) dynamiquement
- Changer les types de graphiques (courbe, barres, camembert, jauge...)
- Proposer des visualisations adaptées aux données
- Modifier complètement le layout du dashboard

## 📁 Structure

```
_future/
├── contexts/
│   └── DynamicDashboardContext.tsx  # État global du dashboard dynamique
├── components/
│   ├── DynamicWidget.tsx            # Composant widget générique
│   ├── charts/
│   │   ├── BarChartWidget.tsx       # Graphique en barres
│   │   ├── PieChartWidget.tsx       # Camembert
│   │   ├── GaugeWidget.tsx          # Jauge
│   │   ├── TableWidget.tsx          # Tableau de données
│   │   └── KPIWidget.tsx            # KPI simple
│   └── WidgetSelector.tsx           # Sélecteur de type de widget
├── api/
│   └── dashboard-builder/
│       └── route.ts                 # API pour construire le dashboard
└── types/
    └── dashboard.ts                 # Types TypeScript
```

## 🔧 Comment activer

1. Importer le `DynamicDashboardProvider` dans le layout
2. Remplacer la page tableau-de-bord par la version dynamique
3. Mettre à jour l'agent IA pour utiliser la nouvelle API

## ⚠️ Status

🔴 NON ACTIVÉ - En développement

