#!/bin/sh
set -e

# Initialize database on first run
if [ ! -f /app/data/metrics.db ]; then
    echo "Initializing database..."
    node /app/scripts/init-db.js
fi

exec "$@"
