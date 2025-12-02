#!/bin/bash

# Script pour configurer la clé API Tavily dans .env.local

TAVILY_KEY="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"
ENV_FILE=".env.local"

echo "🔑 Configuration de la clé API Tavily..."

# Vérifier si .env.local existe
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Création du fichier .env.local depuis env.example..."
    cp env.example "$ENV_FILE"
fi

# Vérifier si TAVILY_API_KEY existe déjà
if grep -q "TAVILY_API_KEY" "$ENV_FILE"; then
    echo "✏️  Mise à jour de la clé API Tavily existante..."
    # Mettre à jour la ligne existante (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|TAVILY_API_KEY=.*|TAVILY_API_KEY=$TAVILY_KEY|" "$ENV_FILE"
    else
        sed -i "s|TAVILY_API_KEY=.*|TAVILY_API_KEY=$TAVILY_KEY|" "$ENV_FILE"
    fi
else
    echo "➕ Ajout de la clé API Tavily..."
    echo "" >> "$ENV_FILE"
    echo "# Tavily API Key" >> "$ENV_FILE"
    echo "TAVILY_API_KEY=$TAVILY_KEY" >> "$ENV_FILE"
fi

# S'assurer que WEB_SEARCH_PROVIDER est configuré
if ! grep -q "WEB_SEARCH_PROVIDER" "$ENV_FILE"; then
    echo "➕ Configuration du provider de recherche web..."
    echo "WEB_SEARCH_PROVIDER=tavily" >> "$ENV_FILE"
elif ! grep -q "WEB_SEARCH_PROVIDER=tavily" "$ENV_FILE"; then
    echo "✏️  Mise à jour du provider de recherche web..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|WEB_SEARCH_PROVIDER=.*|WEB_SEARCH_PROVIDER=tavily|" "$ENV_FILE"
    else
        sed -i "s|WEB_SEARCH_PROVIDER=.*|WEB_SEARCH_PROVIDER=tavily|" "$ENV_FILE"
    fi
fi

echo "✅ Configuration terminée !"
echo ""
echo "📋 Vérification de la configuration :"
grep -E "(TAVILY_API_KEY|WEB_SEARCH_PROVIDER)" "$ENV_FILE" | head -2
echo ""
echo "🚀 Redémarrez votre serveur de développement pour appliquer les changements :"
echo "   npm run dev"

