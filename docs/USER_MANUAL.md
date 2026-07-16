# TradeFlo — Complete User Manual 📘

Welcome to **TradeFlo**, your custom-built Trading Operating System. This manual explains the purpose, workflow, and features of each module inside the platform.

---

## Table of Contents
1. [Overview](#1-overview)
2. [Dashboard (Performance Hub)](#2-dashboard-performance-hub)
3. [Chart (TradingView Workspace)](#3-chart-tradingview-workspace)
4. [Trade (Execution & Position Calculator)](#4-trade-execution--position-calculator)
5. [Journal (Disciplined Logging)](#5-journal-disciplined-logging)
6. [Backtesting Workspace](#6-backtesting-workspace)
7. [Notebook (Checklists & Strategy Logs)](#7-notebook-checklists--strategy-logs)
8. [Sanctuary (Psychology & Mindfulness Reset)](#8-sanctuary-psychology--mindfulness-reset)
9. [Academy (Smart Money Concepts)](#9-academy-smart-money-concepts)
10. [AI Coach (FloAI)](#10-ai-coach-floai)

---

## 1. Overview
TradeFlo is designed to prevent emotional trading by combining live market feeds, execution ticket calculations, statistical analytics, psychological centering, and AI coaching into a single interface. 

---

## 2. Dashboard (Performance Hub)
The Dashboard provides an overview of your active trading account.
- **Stats Grid:** Real-time metrics including **Win Rate**, **Profit Factor**, **Expected Value (EV)** per trade, and **Max Drawdown**.
- **Edge Score Gauge:** A radial rating out of 100 calculated using consistency, win rate, and drawdown preservation rules.
  - *Elite (80+)*: Exemplary risk and consistency.
  - *Disciplined (60-80)*: Solid execution.
  - *Average (40-60)*: Watching drawdown limits.
  - *Tilted (<40)*: Emotional warning. Rest in the **Sanctuary**.
- **Risk Alerts:** Evaluates your open/closed trades and triggers warnings if you are overtrading, revenge trading, or approaching your daily loss limit.

---

## 3. Chart (TradingView Workspace)
Powered by the full TradingView `tv.js` API:
- **Drawing Tools:** Full access to trendlines, Fibonacci retracements, channels, and text annotations on the left-side toolbar.
- **Indicators:** Search and load any indicators (Volume, Moving Averages, RSI, MACD) using the top header.
- **Timeframes:** Switch instantly from 1-minute to weekly intervals using the navigation control bar.

---

## 4. Trade (Execution & Position Calculator)
The Trade tab is your order ticket dashboard:
- **Position Calculator:** Computes projected risk in exact cash and account percentage before you enter the market.
- **Guardrails:** Warns you dynamically if the calculated risk exceeds your per-trade limit (e.g. 1% of balance).
- **Execution:** BUY/SELL buttons send order details directly to the broker/MT5 backend.

---

## 5. Journal (Disciplined Logging)
Record details for every trade to gather statistics for the AI engine:
- **Parameters:** Symbol, Lot size, direction, and actual Entry/Exit prices.
- **Analytics tags:** Log your setup strategies, confluences, notes, and mistakes.
- **Account Reconciliation:** SQLAlchemy automatically updates your account balance when trades are logged.

---

## 6. Backtesting Workspace
A designated area to log historical data simulations:
- Log strategy tests across multiple pairs and timeframes.
- Calculates aggregate win rates and net simulated return to verify if your strategy has a statistical edge.

---

## 7. Notebook (Checklists & Strategy Logs)
Organize your strategy papers, daily routines, and weekly reviews:
- **Markdown Support:** Write and edit strategy documents.
- **Templates:** Instant loaders for:
  - *Pre-Market Checklist* (bias, news checks, patience rules).
  - *Strategy Blueprint* (BOS/CHoCH entry requirements).
  - *Weekly Performance Review* (lessons learned).

---

## 8. Sanctuary (Psychology & Mindfulness Reset)
A timed re-centering widget built to prevent revenge trading:
- Uses the **4-7-8 breathing method**:
  - Inhale quietly (4 seconds) — Circle expands.
  - Hold breath (7 seconds) — Circle glows.
  - Exhale slowly (8 seconds) — Circle contracts.
- Promotes biological state-shifting to drop cortisol levels before you take another trade.

---

## 9. Academy (Smart Money Concepts)
Your internal education manual containing cheatsheets on Smart Money Concepts (SMC):
- Visual text diagrams for **BOS vs CHoCH**, **Fair Value Gaps (FVG)**, **Order Blocks (OB)**, and **Liquidity Sweeps**.
- Clear rule lists to cross-reference while analyzing setups.

---

## 10. AI Coach (FloAI)
Your personal trading counselor:
- Fully integrated with your trade log and database.
- Chat naturally about trading psychology, review your metrics, or ask: *"What symbol am I most profitable on?"* or *"Analyze my biggest mistakes this week."*
