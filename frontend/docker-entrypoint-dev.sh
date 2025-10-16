#!/bin/sh
set -e

cd /app

# Ensure dependencies are installed (named volume may start empty on first run)
echo "[entrypoint] Installing/updating npm dependencies..."
npm install

# Start the warm development server which precompiles routes automatically
PORT_NUMBER="${PORT:-3000}"
HOST_ADDRESS="${HOST:-0.0.0.0}"

export PORT="${PORT_NUMBER}"
export HOST="${HOST_ADDRESS}"

echo "[entrypoint] Starting Next.js warm development server on ${HOST_ADDRESS}:${PORT_NUMBER}..."
npm run dev:warm
