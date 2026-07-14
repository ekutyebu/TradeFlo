# TradeFlo — Setup Script
# Run this once to scaffold the entire project

Write-Host "=== TradeFlo Setup ===" -ForegroundColor Cyan

# 1. Install frontend dependencies
Write-Host "`n[1/3] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\frontend"
npm install

# 2. Create Python virtual environment
Write-Host "`n[2/3] Creating Python virtual environment..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\backend"
python -m venv .venv
& ".\.venv\Scripts\Activate.ps1"
pip install -r requirements.txt

# 3. Run database migrations
Write-Host "`n[3/3] Running database migrations..." -ForegroundColor Yellow
# Note: SQLAlchemy will automatically create tables on first run, but alembic can be configured here if desired.
# uvicorn will start and create tables via main.py.

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "To run the app, open two terminals and run:" -ForegroundColor Cyan
Write-Host "  In terminal 1: cd c:\Users\ekuty\Desktop\TradeFlo; .\start-backend.ps1" -ForegroundColor Gray
Write-Host "  In terminal 2: cd c:\Users\ekuty\Desktop\TradeFlo; .\start-frontend.ps1" -ForegroundColor Gray

