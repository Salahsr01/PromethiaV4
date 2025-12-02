#!/bin/bash

# ========================================
# Script à exécuter DIRECTEMENT sur le VPS
# ========================================
# Usage: Copiez tout ce script et collez-le dans votre terminal SSH
# ========================================

set -e

echo "🚀 Installation de Promethia sur le VPS..."

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Mise à jour du système
echo -e "${BLUE}[1/8]${NC} Mise à jour du système..."
apt-get update && apt-get upgrade -y
echo -e "${GREEN}✓ Système mis à jour${NC}"

# 2. Installer Node.js 20.x
echo -e "${BLUE}[2/8]${NC} Installation de Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v
npm -v
echo -e "${GREEN}✓ Node.js installé${NC}"

# 3. Installer PM2
echo -e "${BLUE}[3/8]${NC} Installation de PM2..."
npm install -g pm2
echo -e "${GREEN}✓ PM2 installé${NC}"

# 4. Installer Git
echo -e "${BLUE}[4/8]${NC} Installation de Git..."
apt-get install -y git
echo -e "${GREEN}✓ Git installé${NC}"

# 5. Créer le dossier de l'application
echo -e "${BLUE}[5/8]${NC} Création du dossier application..."
mkdir -p /var/www/promethia
echo -e "${GREEN}✓ Dossier créé: /var/www/promethia${NC}"

# 6. Afficher les instructions pour le transfert
echo -e "${BLUE}[6/8]${NC} ${RED}PAUSE - Action requise sur votre machine locale${NC}"
echo ""
echo "=========================================="
echo "Sur VOTRE MACHINE LOCALE, ouvrez un NOUVEAU terminal et exécutez:"
echo ""
echo "cd /Volumes/T7/PromethiaV3-2"
echo "rsync -avz --progress \\"
echo "  --exclude 'node_modules' \\"
echo "  --exclude '.next' \\"
echo "  --exclude '.git' \\"
echo "  --exclude 'budget-creation (1)' \\"
echo "  --exclude 'react-email-starter' \\"
echo "  --exclude '.env.local' \\"
echo "  ./ root@51.68.125.95:/var/www/promethia/"
echo ""
echo "=========================================="
echo ""
read -p "Appuyez sur ENTRÉE une fois le transfert terminé..."

# 7. Créer le fichier .env.local
echo -e "${BLUE}[7/8]${NC} Configuration des variables d'environnement..."
cat > /var/www/promethia/.env.local << 'ENVEOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ftysvyzrntsusgyqznsp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eXN2eXpybnRzdXNneXF6bnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDQwMDQsImV4cCI6MjA3OTkyMDAwNH0.z8lIsnbjy0lUPkiEDucYiLkcsJvmWo96iJL_CNvmkts
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eXN2eXpybnRzdXNneXF6bnNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0NDAwNCwiZXhwIjoyMDc5OTIwMDA0fQ.xiUeuT768cjtTGoJJXaGJ-l55NPu_FQJFDgAKTKIWH0

# Anthropic (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Resend (Email)
RESEND_API_KEY=re_R7CERN1w_LTTtWbnmqJtCWE6kzReLzPas
ENVEOF
echo -e "${GREEN}✓ Variables d'environnement configurées${NC}"

# 8. Installer les dépendances et build
echo -e "${BLUE}[8/8]${NC} Installation des dépendances et build (cela peut prendre 5-10 minutes)..."
cd /var/www/promethia
npm install
npm run build
echo -e "${GREEN}✓ Application buildée${NC}"

# 9. Démarrer avec PM2
echo -e "${BLUE}[9/8]${NC} Démarrage de l'application..."
pm2 delete promethia 2>/dev/null || true
pm2 start npm --name promethia -- start
pm2 save
pm2 startup systemd -u root --hp /root | tail -n 1 | bash
echo -e "${GREEN}✓ Application démarrée${NC}"

# Afficher le statut
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Installation terminée avec succès !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
pm2 status
echo ""
echo "🌐 Application accessible sur: http://51.68.125.95:3000"
echo ""
echo "Prochaines étapes:"
echo "1. Installer Nginx: apt-get install -y nginx"
echo "2. Configurer le domaine dans OVHcloud"
echo "3. Installer SSL avec certbot"
