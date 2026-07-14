from fastapi import APIRouter, HTTPException
from typing import Optional
import schemas

router = APIRouter()

# ─── MT5 Execution Hooks ───────────────────────────────────────────────────────
# These endpoints are stubs ready to be wired to MetaTrader5 Python library.
# Install: pip install MetaTrader5
# Then replace the stub bodies with actual MT5 calls.

@router.post("/mt5/execute")
def execute_mt5_order(order: schemas.MT5OrderRequest):
    """
    Execute a market/limit order via MetaTrader5.
    Currently a stub — wire your MT5 account credentials and uncomment.
    """
    # import MetaTrader5 as mt5
    # mt5.initialize()
    # request = {
    #     "action": mt5.TRADE_ACTION_DEAL,
    #     "symbol": order.symbol,
    #     "volume": order.lot_size,
    #     "type": mt5.ORDER_TYPE_BUY if order.side == "BUY" else mt5.ORDER_TYPE_SELL,
    #     "price": mt5.symbol_info_tick(order.symbol).ask,
    #     "sl": order.stop_loss or 0.0,
    #     "tp": order.take_profit or 0.0,
    #     "comment": order.comment,
    # }
    # result = mt5.order_send(request)
    # return {"success": result.retcode == mt5.TRADE_RETCODE_DONE, "result": result._asdict()}

    return {
        "status": "stub",
        "message": "MT5 execution not yet connected. Add your MT5 credentials and uncomment the MT5 code in market.py.",
        "order": order.model_dump(),
    }


@router.get("/mt5/positions")
def get_mt5_positions():
    """Get open positions from MetaTrader5 (stub)."""
    # import MetaTrader5 as mt5
    # mt5.initialize()
    # positions = mt5.positions_get()
    # return [p._asdict() for p in positions]
    return {"status": "stub", "positions": [], "message": "MT5 not connected."}


@router.get("/mt5/account-info")
def get_mt5_account_info():
    """Get MT5 account info (stub)."""
    return {"status": "stub", "account_info": {}, "message": "MT5 not connected."}


# ─── Live Price (REST fallback) ────────────────────────────────────────────────

@router.get("/price/{symbol}")
def get_price(symbol: str):
    """
    Returns a simulated price. Use the /ws/market/{symbol} WebSocket for live streaming.
    """
    import random
    seed_prices = {
        "EURUSD": 1.0850, "GBPUSD": 1.2700, "USDJPY": 149.50,
        "XAUUSD": 2350.00, "BTCUSD": 65000.00, "NAS100": 18500.00,
        "US30": 39000.00, "AUDUSD": 0.6500,
    }
    price = seed_prices.get(symbol.upper(), 1.0000)
    price += random.gauss(0, price * 0.001)
    return {
        "symbol": symbol.upper(),
        "bid": round(price, 5),
        "ask": round(price + price * 0.0001, 5),
        "source": "simulated — connect MT5 for live data",
    }
