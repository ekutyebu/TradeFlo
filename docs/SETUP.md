# TradeFlo — Quick Start Setup Guide 🚀

TradeFlo is fully automated. You only need to verify your prerequisites and double-click one file.

---

## Prerequisites

Before running TradeFlo, ensure you have:
- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **Python** 3.10+ ([python.org](https://python.org))
- **PostgreSQL** 14+ (Installed on port 5432)

---

## Step 1 — Setup Environment variables

Ensure your PostgreSQL password is set in `backend/.env`. By default, we have configured it with:
```env
DATABASE_URL=postgresql://postgres:Man2001%40@localhost:5432/tradeflo
```
*(If your PostgreSQL password ever changes, open `backend/.env` and update it there, percent-encoding `@` as `%40`).*

---

## Step 2 — Double Click `start.bat`

At the root of the project, double-click `start.bat` (or run it in your terminal: `start.bat`).

This script will automatically:
1. Check if `node_modules` is installed in `/frontend`. If not, it will run `npm install`.
2. Check if a Python virtual environment (`.venv`) is created in `/backend`. If not, it will build it and install all pip dependencies from `requirements.txt`.
3. Launch your **FastAPI Backend server** in a new window.
4. Launch your **Next.js Frontend server** in a new window.
5. Create the PostgreSQL database `tradeflo` automatically on your server if it does not exist.
6. Verify and compile the entire database schema.
7. Run the **Monthly Database Backup** script to save snapshots of your data in `/backups` folder.

---

## Step 3 — Access TradeFlo

Once both windows are running, open your browser:
* **Frontend UI:** [http://localhost:3000](http://localhost:3000)
* **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Monthly Database Backups 💾
* The app automatically runs a check on startup every month.
* If your database has data, it creates a snapshot file in `/backups` at the root folder of the project (`backup_YYYY_MM.sql` for PostgreSQL or `backup_YYYY_MM.db` if falling back to SQLite).
* You do not need to set up any cron jobs or triggers; the system manages it completely.
