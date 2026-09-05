# Clean install: remove node_modules, then reinstall frontend + backend deps.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "Removing frontend/node_modules (if present)..."
if (Test-Path "frontend\node_modules") {
  Remove-Item -Recurse -Force "frontend\node_modules"
  Write-Host "  deleted frontend/node_modules"
} else {
  Write-Host "  frontend/node_modules not found (skip)"
}

Write-Host "Removing backend/node_modules (if present)..."
if (Test-Path "backend\node_modules") {
  Remove-Item -Recurse -Force "backend\node_modules"
  Write-Host "  deleted backend/node_modules"
} else {
  Write-Host "  backend/node_modules not found (skip)"
}

Write-Host "Installing backend dependencies..."
Push-Location backend
npm install
Pop-Location

Write-Host "Installing frontend dependencies..."
Push-Location frontend
npm install
Pop-Location

Write-Host "Clean install complete."
