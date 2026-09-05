#!/usr/bin/env bash
# Start API + Angular in test mode (purple theme).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env from .env.example"
fi

# Force test mode for this run
if grep -q '^APP_MODE=' backend/.env; then
  sed -i.bak 's/^APP_MODE=.*/APP_MODE=test/' backend/.env && rm -f backend/.env.bak
else
  echo 'APP_MODE=test' >> backend/.env
fi

echo "Starting backend (test) on http://localhost:3000 ..."
(cd backend && npm run dev) &
BACK_PID=$!

echo "Starting frontend on http://localhost:4200 ..."
(cd frontend && npm start) &
FRONT_PID=$!

echo "Test mode running."
echo "  Login: superuser / test@123"
echo "  Ctrl+C stops this shell; kill PIDs $BACK_PID $FRONT_PID if needed."

trap 'kill $BACK_PID $FRONT_PID 2>/dev/null || true' EXIT
wait
