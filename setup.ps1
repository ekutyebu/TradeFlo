# TradeFlo — Setup Script
# Run this once to scaffold the entire project

Write-Host "=== TradeFlo Setup ===" -ForegroundColor Cyan

# 1. Create Next.js Frontend
Write-Host "`n[1/4] Creating Next.js frontend..." -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git --yes

# 2. Install frontend dependencies
Write-Host "`n[2/4] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\frontend"
npm install framer-motion recharts @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs lucide-react date-fns

# 3. Create Python virtual environment
Write-Host "`n[3/4] Creating Python virtual environment..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 4. Run database migrations
Write-Host "`n[4/4] Running database migrations..." -ForegroundColor Yellow
alembic upgrade head

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "Run 'start-backend.ps1' and 'start-frontend.ps1' to start dev servers." -ForegroundColor Cyan
