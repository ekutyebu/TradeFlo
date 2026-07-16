@echo off
title TradeFlo Boot Manager
echo ===================================================
echo               TRADEFLO BOOT MANAGER
echo ===================================================
echo.

:: 1. Check and restore Frontend dependencies
if not exist "frontend\node_modules\" (
    echo [FRONTEND] node_modules not found. Installing dependencies...
    cd frontend
    call npm install
    cd ..
) else (
    echo [FRONTEND] node_modules found.
)

:: 2. Check and restore Backend environment
if not exist "backend\.venv\" (
    echo [BACKEND] Virtual environment (.venv) not found. Creating...
    cd backend
    python -m venv .venv
    call .venv\Scripts\activate.bat
    echo [BACKEND] Installing requirements...
    pip install -r requirements.txt
    cd ..
) else (
    echo [BACKEND] Virtual environment found.
    :: Do a quick install check to ensure packages are correct
    cd backend
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

echo.
echo ===================================================
echo               LAUNCHING DEV SERVERS
echo ===================================================
echo.

:: Start Backend in a new window
echo Launching FastAPI Backend...
start "TradeFlo Backend" cmd /k "cd backend && call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

:: Start Frontend in a new window
echo Launching Next.js Frontend...
start "TradeFlo Frontend" cmd /k "cd frontend && set NODE_OPTIONS=--max-old-space-size=2048 && npm run dev"

echo.
echo TradeFlo is booting up!
echo   - Backend API running on http://localhost:8000
echo   - Frontend App running on http://localhost:3000
echo.

:: Prompt to run DB Studio
set /p run_db="Do you want to launch Database Studio? (y/n): "
if /i "%run_db%"=="y" (
    echo.
    echo Launching Database Studio...
    :: Attempt to launch pgAdmin 4 or DBeaver from PATH or default Windows installation paths
    start pgadmin4.exe 2>nul || start dbeaver.exe 2>nul || start "" "C:\Program Files\pgAdmin 4\bin\pgAdmin4.exe" 2>nul || start "" "C:\Program Files\pgAdmin 4\v8\runtime\pgAdmin4.exe" 2>nul || start "" "C:\Program Files\DBeaver\dbeaver.exe" 2>nul || start "" "http://localhost:5050"
)

echo.
echo Boot sequence complete. Close the backend/frontend command prompts to stop the app.
echo.
pause
