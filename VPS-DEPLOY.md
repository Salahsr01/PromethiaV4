# 🚀 Déploiement sur VPS OVHcloud

Guide complet pour déployer Promethia sur votre VPS.

## 📋 Informations VPS

- **IP**: 51.68.125.95
- **OS**: Ubuntu 22.04
- **Domaine**: v1.promethia-one.com
- **Ressources**: 6 vCores, 12 Go RAM, 100 Go SSD

## 🎯 Déploiement en 3 étapes

### Étape 1: Déployer l'application (5-10 minutes)

```bash
# Depuis votre machine locale
./deploy-vps.sh
```

Ce script va automatiquement:
- ✅ Installer Node.js 20.x
- ✅ Installer PM2 (gestionnaire de processus)
- ✅ Transférer votre code vers le VPS
- ✅ Configurer les variables d'environnement
- ✅ Build l'application
- ✅ Démarrer l'application avec PM2

### Étape 2: Configurer Nginx (2-3 minutes)

```bash
# Depuis votre machine locale
./setup-nginx.sh
```

Ce script va:
- ✅ Installer Nginx
- ✅ Configurer le reverse proxy
- ✅ Installer Certbot pour SSL

### Étape 3: Configurer le DNS (5-30 minutes)

#### A. Dans OVHcloud

1. Connectez-vous sur https://www.ovh.com/manager/
2. Allez dans **Web Cloud** → **Noms de domaine**
3. Sélectionnez **promethia-one.com**
4. Cliquez sur **Zone DNS**
5. Cliquez sur **Ajouter une entrée**

Ajoutez cet enregistrement:
```
Type: A
Sous-domaine: v1
Cible: 51.68.125.95
TTL: 3600
```

#### B. Vérifier la propagation DNS

```bash
# Sur votre machine
dig v1.promethia-one.com

# Ou utilisez https://dnschecker.org
```

Attendez que l'IP `51.68.125.95` apparaisse (5-30 minutes).

#### C. Activer HTTPS avec Let's Encrypt

Une fois le DNS propagé:

```bash
# Connectez-vous au VPS
ssh root@51.68.125.95

# Installez le certificat SSL (automatique)
certbot --nginx -d v1.promethia-one.com

# Suivez les instructions (entrez votre email)
# Certbot configurera automatiquement HTTPS
```

## ✅ Vérification

### Après l'étape 1 (Application)

```bash
# Vérifier que l'app tourne
ssh root@51.68.125.95 'pm2 status'

# Tester l'app en direct
curl http://51.68.125.95:3000
```

### Après l'étape 2 (Nginx)

```bash
# Tester Nginx
curl http://51.68.125.95
```

### Après l'étape 3 (DNS + SSL)

- Ouvrez https://v1.promethia-one.com dans votre navigateur
- Vous devriez voir votre application avec le cadenas SSL vert 🔒

## 🔧 Commandes utiles

### Gestion de l'application

```bash
# Voir les logs en temps réel
ssh root@51.68.125.95 'pm2 logs promethia'

# Redémarrer l'application
ssh root@51.68.125.95 'pm2 restart promethia'

# Arrêter l'application
ssh root@51.68.125.95 'pm2 stop promethia'

# Voir le statut
ssh root@51.68.125.95 'pm2 status'
```

### Gestion de Nginx

```bash
# Redémarrer Nginx
ssh root@51.68.125.95 'systemctl restart nginx'

# Voir les logs Nginx
ssh root@51.68.125.95 'tail -f /var/log/nginx/promethia-error.log'

# Tester la configuration
ssh root@51.68.125.95 'nginx -t'
```

### Mise à jour de l'application

Pour déployer une nouvelle version:

```bash
# Méthode 1: Script automatique
./deploy-vps.sh

# Méthode 2: Manuelle
ssh root@51.68.125.95
cd /var/www/promethia
git pull
npm install
npm run build
pm2 restart promethia
```

## 🔐 Sécurité

### Configurer le pare-feu

```bash
ssh root@51.68.125.95

# Installer UFW
apt-get install -y ufw

# Autoriser SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Activer le pare-feu
ufw enable
```

### Sécuriser SSH (optionnel)

```bash
ssh root@51.68.125.95

# Créer un utilisateur non-root
adduser promethia
usermod -aG sudo promethia

# Désactiver la connexion root par mot de passe
nano /etc/ssh/sshd_config
# Modifier: PermitRootLogin no

systemctl restart ssh
```

## 🚨 Troubleshooting

### L'application ne démarre pas

```bash
ssh root@51.68.125.95
cd /var/www/promethia
pm2 logs promethia --lines 100
```

### Erreur 502 Bad Gateway (Nginx)

```bash
# Vérifier que l'app tourne
ssh root@51.68.125.95 'pm2 status'

# Vérifier les logs Nginx
ssh root@51.68.125.95 'tail -f /var/log/nginx/promethia-error.log'
```

### Le domaine ne se résout pas

- Vérifiez que l'enregistrement DNS est correct dans OVHcloud
- Attendez jusqu'à 48h (généralement < 30 minutes)
- Utilisez https://dnschecker.org pour vérifier la propagation

### SSL ne fonctionne pas

```bash
# Vérifier que le DNS pointe bien vers votre VPS
dig v1.promethia-one.com

# Réessayer Certbot
ssh root@51.68.125.95
certbot --nginx -d v1.promethia-one.com --force-renewal
```

## 📊 Monitoring

### Installer un monitoring simple

```bash
ssh root@51.68.125.95

# Installer PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Vérifier les ressources

```bash
ssh root@51.68.125.95

# CPU et RAM
htop

# Espace disque
df -h

# Logs de l'application
pm2 monit
```

## 🎉 C'est fait !

Une fois toutes les étapes complétées:

1. ✅ Application accessible sur https://v1.promethia-one.com
2. ✅ SSL activé avec Let's Encrypt
3. ✅ PM2 gère l'application automatiquement
4. ✅ Redémarre automatiquement en cas de crash
5. ✅ Redémarre au reboot du serveur

### Tester la collaboration

1. Allez sur https://v1.promethia-one.com
2. Démarrez une session collaborative
3. Envoyez une invitation à zakryn20@gmail.com
4. La personne recevra un email avec le lien
5. Elle cliquera dessus et rejoindra depuis n'importe où ! 🌍

**Votre application est maintenant en production ! 🚀**
