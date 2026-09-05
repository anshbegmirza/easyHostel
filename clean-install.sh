#!/usr/bin/env bash
# Clean install: remove node_modules, then reinstall frontend + backend deps.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Removing frontend/node_modules (if present)..."
rm -rf frontend/node_modules

echo "Removing backend/node_modules (if present)..."
rm -rf backend/node_modules

echo "Removing package-lock caches is optional; keeping lockfiles."
echo "Installing backend dependencies..."
(cd backend && npm install)

echo "Installing frontend dependencies..."
(cd frontend && npm install)

echo "Clean install complete."
