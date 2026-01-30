# Deployment

## Quick Start (DigitalOcean Droplet)

1. Create a $6/mo Ubuntu 22.04 droplet
2. SSH in and run:
   ```bash
   curl -sSL https://raw.githubusercontent.com/biotic-labor/personal-metrics/main/deploy/setup-droplet.sh | bash
   ```
3. Point `metrics.bioticlabor.com` A record to your droplet IP
4. Access at https://metrics.bioticlabor.com

## Manual Setup

```bash
git clone https://github.com/biotic-labor/personal-metrics.git
cd personal-metrics/deploy
echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env
docker compose up -d --build
```

## Adding Your Main Site

1. Edit `docker-compose.yml` - uncomment and configure the `main` service
2. Edit `Caddyfile` - uncomment the `bioticlabor.com` block
3. Restart: `docker compose up -d`

## Commands

```bash
# View logs
docker compose logs -f

# Restart
docker compose restart

# Update (after git pull)
docker compose up -d --build

# View running containers
docker compose ps

# Shell into metrics container
docker compose exec metrics sh

# Backup database
docker compose cp metrics:/app/data/metrics.db ./backup-$(date +%Y%m%d).db
```

## Health Auto Export Webhook

URL: `https://metrics.bioticlabor.com/api/health/import?key=chris@example.com`

## SSL Certificates

Caddy handles SSL automatically via Let's Encrypt. Certificates are stored in the `caddy_data` volume and auto-renewed.
