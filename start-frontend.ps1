# Start TradeFlo Frontend
Set-Location -Path "$PSScriptRoot\frontend"
$env:NODE_OPTIONS = "--max-old-space-size=2048"
Write-Host "Starting Next.js frontend on http://localhost:3000" -ForegroundColor Green
npm run dev
