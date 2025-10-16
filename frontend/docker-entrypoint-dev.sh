#!/bin/sh
set -e

cd /app

# Ensure dependencies are installed (named volume may start empty on first run)
echo "[entrypoint] Installing/updating npm dependencies..."
npm install

# Start Next.js development server and bind to all interfaces for Docker
echo "[entrypoint] Starting Next.js development server..."
exec npm run dev -- --hostname 0.0.0.0 --port "${PORT:-3000}"
