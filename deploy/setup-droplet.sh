#!/bin/bash
# Run this on a fresh Ubuntu 22.04+ droplet
# curl -sSL https://raw.githubusercontent.com/biotic-labor/personal-metrics/main/deploy/setup-droplet.sh | bash

set -e

echo "==> Updating system"
apt-get update && apt-get upgrade -y

echo "==> Installing Docker"
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

echo "==> Installing Docker Compose plugin"
apt-get install -y docker-compose-plugin

echo "==> Creating app directory"
mkdir -p /opt/apps
cd /opt/apps

echo "==> Cloning repository"
git clone https://github.com/biotic-labor/personal-metrics.git
cd personal-metrics/deploy

echo "==> Generating secrets"
echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env

echo "==> Building and starting services"
docker compose up -d --build

echo ""
echo "==> Setup complete!"
echo ""
echo "Next steps:"
echo "1. Point DNS for metrics.bioticlabor.com to this server's IP"
echo "2. Wait for DNS propagation (check with: dig metrics.bioticlabor.com)"
echo "3. Caddy will auto-provision SSL certificates"
echo ""
echo "Useful commands:"
echo "  cd /opt/apps/personal-metrics/deploy"
echo "  docker compose logs -f        # View logs"
echo "  docker compose restart        # Restart services"
echo "  docker compose pull && docker compose up -d  # Update"
echo ""
echo "Login: chris@example.com / password123"
echo "Change password after first login!"
