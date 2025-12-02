# 🔥 Promethia

**Assistant IA professionnel pour la gestion de projet et l'analyse de données**

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet-orange)

## ✨ Fonctionnalités

- 🤖 **Chat IA intelligent** - Propulsé par Claude (Anthropic) avec fallback Ollama
- 📊 **Tableau de bord interactif** - Graphiques modifiables par l'IA
- 📱 **Design responsive** - Adapté à tous les écrans (mobile, tablette, desktop)
- 🚀 **PWA Ready** - Installable comme application native
- 🔒 **Sécurisé** - Prêt pour la production avec Docker et Nginx

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- npm ou yarn
- Clé API Anthropic (Claude)

### Installation

```bash
# Cloner le projet
git clone https://github.com/votre-repo/promethia.git
cd promethia

# Installer les dépendances
npm install

# Configurer l'environnement
cp env.example .env.local
# Éditer .env.local avec votre clé API Anthropic

# Lancer en développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `AI_PROVIDER` | Provider IA (`claude` ou `ollama`) | `claude` |
| `ANTHROPIC_API_KEY` | Clé API Anthropic | - |
| `AI_MODEL` | Modèle IA à utiliser | `claude-sonnet-4-20250514` |
| `OLLAMA_BASE_URL` | URL du serveur Ollama | `http://localhost:11434` |

### Modèles IA supportés

**Claude (Anthropic):**
- `claude-sonnet-4-20250514` (recommandé)
- `claude-3-5-sonnet-20241022`
- `claude-3-haiku-20240307`

**Ollama (local):**
- `mistral:latest`
- `llama2:latest`
- `qwen2.5:7b`

## 🐳 Déploiement Docker

### Build et déploiement simple

```bash
# Construire l'image
docker build -t promethia .

# Lancer le conteneur
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-xxx promethia
```

### Déploiement avec Docker Compose

```bash
# Copier et configurer l'environnement
cp env.example .env
nano .env

# Déployer
docker-compose up -d

# Avec Nginx (production)
docker-compose --profile with-nginx up -d

# Avec Ollama local
docker-compose --profile with-ollama up -d
```

### Script de déploiement automatique

```bash
chmod +x deploy.sh
./deploy.sh production
```

## 🌐 Déploiement VPS (OVHcloud)

### 1. Préparer le serveur

```bash
# Se connecter au VPS
ssh root@votre-vps-ip

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
apt install docker-compose-plugin
```

### 2. Déployer l'application

```bash
# Cloner le projet
git clone https://github.com/votre-repo/promethia.git
cd promethia

# Configurer
cp env.example .env
nano .env  # Ajouter votre clé API

# Déployer
./deploy.sh production
```

### 3. Configurer SSL (Let's Encrypt)

```bash
# Installer Certbot
apt install certbot

# Générer le certificat
certbot certonly --standalone -d votre-domaine.com

# Copier les certificats
mkdir -p ssl
cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem ssl/

# Redémarrer avec Nginx
docker-compose --profile with-nginx up -d
```

## 📱 PWA (Progressive Web App)

L'application est configurée comme PWA et peut être installée sur :

- **iOS** : Safari → Partager → Sur l'écran d'accueil
- **Android** : Chrome → Menu → Installer l'application
- **Desktop** : Chrome/Edge → Barre d'adresse → Installer

## 🏗️ Structure du projet

```
promethia/
├── app/
│   ├── api/              # Routes API
│   │   ├── chat/         # Endpoint chat IA
│   │   ├── generate-*/   # Génération titre/suggestions
│   │   └── health/       # Health check
│   ├── components/       # Composants React
│   │   └── ui/          # Composants UI réutilisables
│   ├── contexts/        # Contextes React
│   ├── hooks/           # Hooks personnalisés
│   ├── lib/             # Utilitaires et providers
│   └── tableau-de-bord/ # Page dashboard
├── public/              # Assets statiques
├── Dockerfile          # Image Docker
├── docker-compose.yml  # Configuration Docker Compose
├── nginx.conf          # Configuration Nginx
└── deploy.sh           # Script de déploiement
```

## 🔧 Développement

```bash
# Lancer en mode développement
npm run dev

# Linter
npm run lint

# Build production
npm run build

# Lancer en production
npm start
```

## 📄 Licence

MIT © 2024 Promethia

---

<p align="center">
  Fait avec ❤️ par l'équipe Promethia
</p>
