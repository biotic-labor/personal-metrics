#!/bin/sh
set -e

# Initialize metrics database on first run
if [ ! -f /app/data/metrics.db ]; then
    echo "Initializing metrics database..."
    node /app/scripts/init-db.js
fi

# Initialize meals database on first run
if [ ! -f /app/data/meals.db ]; then
    echo "Initializing meals database..."
    node /app/scripts/init-meals-db.js
fi

exec "$@"
