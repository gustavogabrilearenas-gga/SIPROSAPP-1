#!/bin/sh
set -e

cd /app

# Ensure dependencies are installed (named volume may start empty on first run)
echo "[entrypoint] Installing/updating npm dependencies..."
npm install

# Start Next.js development server and bind to all interfaces for Docker
PORT_NUMBER="${PORT:-3000}"

echo "[entrypoint] Starting Next.js development server on port ${PORT_NUMBER}..."
npm run dev -- --hostname 0.0.0.0 --port "${PORT_NUMBER}" &
DEV_PID=$!

cleanup() {
  echo "[entrypoint] Stopping Next.js development server (PID ${DEV_PID})"
  kill "$DEV_PID" 2>/dev/null || true
  wait "$DEV_PID" 2>/dev/null || true
}

trap cleanup INT TERM

echo "[entrypoint] Waiting for the development server to become ready..."
until wget -q "http://127.0.0.1:${PORT_NUMBER}" -O /dev/null 2>/dev/null; do
  sleep 1
done

if [ -f ./scripts/warmup-pages.mjs ]; then
  echo "[entrypoint] Precompiling Next.js routes..."
  node ./scripts/warmup-pages.mjs || echo "[entrypoint] Route warmup finished with warnings"
else
  echo "[entrypoint] Warmup script not found, skipping route precompilation."
fi

wait "$DEV_PID"
