#!/bin/bash
# ===========================================
# Promethia - Deployment Script for VPS
# ===========================================
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="promethia"

echo "🚀 Deploying Promethia to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check requirements
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
        cp env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env with your configuration${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Build the application
build_app() {
    echo "🔨 Building application..."
    docker-compose build --no-cache
    echo -e "${GREEN}✅ Build complete${NC}"
}

# Deploy the application
deploy_app() {
    echo "🚀 Starting deployment..."
    
    # Stop existing containers
    docker-compose down --remove-orphans
    
    # Start new containers
    if [ "$ENVIRONMENT" == "production" ]; then
        docker-compose --profile with-nginx up -d
    else
        docker-compose up -d
    fi
    
    echo -e "${GREEN}✅ Deployment complete${NC}"
}

# Health check
health_check() {
    echo "🏥 Running health check..."
    sleep 10
    
    if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        docker-compose logs --tail=50
        exit 1
    fi
}

# Show status
show_status() {
    echo ""
    echo "📊 Deployment Status:"
    echo "===================="
    docker-compose ps
    echo ""
    echo -e "${GREEN}🎉 Promethia is now running!${NC}"
    echo "   Local:   http://localhost:3000"
    echo "   Health:  http://localhost:3000/api/health"
}

# Main execution
main() {
    check_requirements
    build_app
    deploy_app
    health_check
    show_status
}

main

