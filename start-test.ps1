# Start API + Angular in test mode (purple theme).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$envPath = Join-Path $Root "backend\.env"
$examplePath = Join-Path $Root "backend\.env.example"

if (-not (Test-Path $envPath)) {
  Copy-Item $examplePath $envPath
  Write-Host "Created backend/.env from .env.example"
}

# Force test mode
$envText = Get-Content $envPath -Raw
if ($envText -match '(?m)^APP_MODE=') {
  $envText = $envText -replace '(?m)^APP_MODE=.*', 'APP_MODE=test'
} else {
  $envText = $envText.TrimEnd() + "`r`nAPP_MODE=test`r`n"
}
Set-Content -Path $envPath -Value $envText -NoNewline

Write-Host "Starting backend (test) in a new window..."
Start-Process powershell -WorkingDirectory (Join-Path $Root "backend") -ArgumentList @(
  "-NoExit", "-Command", "npm run dev"
)

Write-Host "Starting frontend in a new window..."
Start-Process powershell -WorkingDirectory (Join-Path $Root "frontend") -ArgumentList @(
  "-NoExit", "-Command", "npm start"
)

Write-Host ""
Write-Host "Test mode starting."
Write-Host "  API:  http://localhost:3000"
Write-Host "  App:  http://localhost:4200"
Write-Host "  Login: superuser / test@123"
Write-Host "  Theme: purple (APP_MODE=test)"
