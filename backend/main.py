"""
TradeFlo FastAPI Backend — Main Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocket
import json
import asyncio
import random
from datetime import datetime

from config import settings
from database import engine, Base

# Import all routers
from routers import accounts, trades, sessions, analytics, ai_coach, market

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TradeFlo API",
    description="Trading Operating System — Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(accounts.router, prefix="/api/accounts", tags=["Accounts"])
app.include_router(trades.router, prefix="/api/trades", tags=["Trades"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ai_coach.router, prefix="/api/ai", tags=["AI Coach"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "TradeFlo API is running", "version": "1.0.0", "timestamp": datetime.utcnow()}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow()}


# ─── WebSocket: Live Market Data ───────────────────────────────────────────────

active_connections: dict = {}


@app.websocket("/ws/market/{symbol}")
async def websocket_market(websocket: WebSocket, symbol: str):
    """
    WebSocket endpoint streaming simulated live ticks for a symbol.
    In production: replace the tick generator with MT5 or broker feed.
    """
    await websocket.accept()
    active_connections[symbol] = active_connections.get(symbol, [])
    active_connections[symbol].append(websocket)

    # Seed prices for common pairs
    seed_prices = {
        "EURUSD": 1.0850, "GBPUSD": 1.2700, "USDJPY": 149.50,
        "XAUUSD": 2350.00, "BTCUSD": 65000.00, "NAS100": 18500.00,
        "US30": 39000.00, "AUDUSD": 0.6500,
    }
    price = seed_prices.get(symbol.upper(), 1.0000)

    try:
        while True:
            # Simulate tick: random walk with ±0.05% move
            change = random.gauss(0, price * 0.0005)
            price = max(price + change, 0.0001)
            spread = price * 0.0001  # 1 pip spread simulation

            tick = {
                "symbol": symbol.upper(),
                "bid": round(price, 5),
                "ask": round(price + spread, 5),
                "spread": round(spread * 10000, 1),
                "timestamp": datetime.utcnow().isoformat(),
            }
            await websocket.send_text(json.dumps(tick))
            await asyncio.sleep(1)  # 1 tick per second
    except Exception:
        if symbol in active_connections:
            active_connections[symbol].remove(websocket)
