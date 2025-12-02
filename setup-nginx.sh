#!/bin/bash

# ========================================
# Configuration de Nginx avec SSL
# ========================================

set -e

echo "🌐 Configuration de Nginx pour Promethia..."

# Variables
VPS_IP="51.68.125.95"
VPS_USER="root"
DOMAIN="v1.promethia-one.com"
APP_PORT="3000"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

remote_exec() {
    ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "$@"
}

# 1. Installer Nginx
echo -e "${BLUE}[1/5]${NC} Installation de Nginx..."
remote_exec "apt-get install -y nginx"
echo -e "${GREEN}✓ Nginx installé${NC}"

# 2. Créer la configuration Nginx
echo -e "${BLUE}[2/5]${NC} Configuration de Nginx..."
remote_exec "cat > /etc/nginx/sites-available/promethia << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Logs
    access_log /var/log/nginx/promethia-access.log;
    error_log /var/log/nginx/promethia-error.log;

    # Taille max des requêtes
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;

        # WebSocket support pour Supabase Realtime
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeouts pour les longues connexions (Realtime)
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;

        # Cache
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF"

# 3. Activer le site
echo -e "${BLUE}[3/5]${NC} Activation du site..."
remote_exec "ln -sf /etc/nginx/sites-available/promethia /etc/nginx/sites-enabled/"
remote_exec "rm -f /etc/nginx/sites-enabled/default"
echo -e "${GREEN}✓ Site activé${NC}"

# 4. Tester et recharger Nginx
echo -e "${BLUE}[4/5]${NC} Test de la configuration Nginx..."
if remote_exec "nginx -t"; then
    echo -e "${GREEN}✓ Configuration valide${NC}"
    remote_exec "systemctl restart nginx"
    remote_exec "systemctl enable nginx"
    echo -e "${GREEN}✓ Nginx redémarré${NC}"
else
    echo -e "${RED}✗ Erreur dans la configuration Nginx${NC}"
    exit 1
fi

# 5. Installer Certbot pour SSL
echo -e "${BLUE}[5/5]${NC} Installation de Certbot pour SSL..."
remote_exec "apt-get install -y certbot python3-certbot-nginx"
echo -e "${GREEN}✓ Certbot installé${NC}"

# Instruction pour SSL
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Nginx configuré avec succès !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT - Configuration DNS${NC}"
echo ""
echo "Avant d'activer SSL, configurez votre DNS:"
echo ""
echo "1. Connectez-vous à OVHcloud"
echo "2. Allez dans 'Noms de domaine' → 'promethia-one.com'"
echo "3. Ajoutez un enregistrement A:"
echo "   - Type: A"
echo "   - Sous-domaine: v1"
echo "   - Cible: $VPS_IP"
echo "   - TTL: 3600"
echo ""
echo "4. Attendez la propagation DNS (5-30 minutes)"
echo "   Vérifiez avec: dig v1.promethia-one.com"
echo ""
echo "5. Une fois le DNS propagé, exécutez:"
echo "   ssh $VPS_USER@$VPS_IP"
echo "   certbot --nginx -d $DOMAIN"
echo ""
echo "Le certificat SSL sera installé automatiquement !"
echo ""
echo "🌐 Application accessible sur:"
echo "   http://$DOMAIN (HTTP)"
echo "   Bientôt: https://$DOMAIN (HTTPS après SSL)"
