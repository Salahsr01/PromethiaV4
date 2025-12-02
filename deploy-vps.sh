#!/bin/bash

# ========================================
# Script de déploiement Promethia sur VPS
# ========================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du déploiement de Promethia..."

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
VPS_IP="51.68.125.95"
VPS_USER="root"
DOMAIN="v1.promethia-one.com"
APP_DIR="/var/www/promethia"
APP_PORT="3000"

echo -e "${BLUE}Configuration:${NC}"
echo "- VPS: $VPS_IP"
echo "- Domaine: $DOMAIN"
echo "- Dossier: $APP_DIR"
echo "- Port: $APP_PORT"
echo ""

# Fonction pour exécuter des commandes sur le VPS
remote_exec() {
    ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "$@"
}

# 1. Vérifier la connexion SSH
echo -e "${BLUE}[1/10]${NC} Vérification de la connexion SSH..."
if remote_exec "echo 'Connexion OK'"; then
    echo -e "${GREEN}✓ Connexion SSH établie${NC}"
else
    echo -e "${RED}✗ Impossible de se connecter au VPS${NC}"
    exit 1
fi

# 2. Mettre à jour le système
echo -e "${BLUE}[2/10]${NC} Mise à jour du système..."
remote_exec "apt-get update && apt-get upgrade -y"
echo -e "${GREEN}✓ Système mis à jour${NC}"

# 3. Installer Node.js 20.x
echo -e "${BLUE}[3/10]${NC} Installation de Node.js 20.x..."
remote_exec "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
remote_exec "node -v && npm -v"
echo -e "${GREEN}✓ Node.js installé${NC}"

# 4. Installer PM2
echo -e "${BLUE}[4/10]${NC} Installation de PM2..."
remote_exec "npm install -g pm2"
echo -e "${GREEN}✓ PM2 installé${NC}"

# 5. Installer Git
echo -e "${BLUE}[5/10]${NC} Installation de Git..."
remote_exec "apt-get install -y git"
echo -e "${GREEN}✓ Git installé${NC}"

# 6. Créer le dossier de l'application
echo -e "${BLUE}[6/10]${NC} Préparation du dossier application..."
remote_exec "mkdir -p $APP_DIR"
echo -e "${GREEN}✓ Dossier créé${NC}"

# 7. Copier les fichiers (exclure node_modules et .next)
echo -e "${BLUE}[7/10]${NC} Transfert des fichiers vers le VPS..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'budget-creation (1)' \
  --exclude 'react-email-starter' \
  --exclude '.env.local' \
  ./ $VPS_USER@$VPS_IP:$APP_DIR/
echo -e "${GREEN}✓ Fichiers transférés${NC}"

# 8. Créer le fichier .env.local sur le VPS
echo -e "${BLUE}[8/10]${NC} Configuration des variables d'environnement..."
remote_exec "cat > $APP_DIR/.env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ftysvyzrntsusgyqznsp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eXN2eXpybnRzdXNneXF6bnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDQwMDQsImV4cCI6MjA3OTkyMDAwNH0.z8lIsnbjy0lUPkiEDucYiLkcsJvmWo96iJL_CNvmkts
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eXN2eXpybnRzdXNneXF6bnNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0NDAwNCwiZXhwIjoyMDc5OTIwMDA0fQ.xiUeuT768cjtTGoJJXaGJ-l55NPu_FQJFDgAKTKIWH0

# Anthropic (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Resend (Email)
RESEND_API_KEY=re_R7CERN1w_LTTtWbnmqJtCWE6kzReLzPas
EOF"
echo -e "${GREEN}✓ Variables d'environnement configurées${NC}"

# 9. Installer les dépendances et build
echo -e "${BLUE}[9/10]${NC} Installation des dépendances et build..."
remote_exec "cd $APP_DIR && npm install && npm run build"
echo -e "${GREEN}✓ Application buildée${NC}"

# 10. Démarrer l'application avec PM2
echo -e "${BLUE}[10/10]${NC} Démarrage de l'application avec PM2..."
remote_exec "cd $APP_DIR && pm2 delete promethia 2>/dev/null || true"
remote_exec "cd $APP_DIR && pm2 start npm --name promethia -- start"
remote_exec "pm2 save"
remote_exec "pm2 startup systemd -u root --hp /root | tail -n 1 | bash"
echo -e "${GREEN}✓ Application démarrée${NC}"

# Afficher le statut
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Déploiement terminé avec succès !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📊 Statut de l'application:"
remote_exec "pm2 status"
echo ""
echo "🌐 Application accessible sur:"
echo "   http://$VPS_IP:3000"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Installer et configurer Nginx (voir setup-nginx.sh)"
echo "   2. Configurer SSL avec Let's Encrypt"
echo "   3. Pointer le domaine $DOMAIN vers $VPS_IP"
echo ""
echo "🔧 Commandes utiles:"
echo "   ssh $VPS_USER@$VPS_IP 'pm2 logs promethia'  # Voir les logs"
echo "   ssh $VPS_USER@$VPS_IP 'pm2 restart promethia'  # Redémarrer"
echo "   ssh $VPS_USER@$VPS_IP 'pm2 stop promethia'  # Arrêter"
