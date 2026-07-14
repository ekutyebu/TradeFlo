# Start TradeFlo Backend
Set-Location -Path "$PSScriptRoot\backend"
.\.venv\Scripts\Activate.ps1
Write-Host "Starting FastAPI backend on http://localhost:8000" -ForegroundColor Green
uvicorn main:app --reload --host 0.0.0.0 --port 8000
