import os
import shutil
import subprocess
from datetime import datetime
from sqlalchemy import create_engine, text
from config import settings
from urllib.parse import urlparse

def run_monthly_backup():
    """Runs a monthly database backup if the database is not empty."""
    backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backups")
    os.makedirs(backup_dir, exist_ok=True)

    current_month = datetime.utcnow().strftime("%Y_%m")
    db_url = settings.database_url

    # Temporary engine to check data presence
    # If the database URL is the fallback SQLite, check if file exists first
    if db_url.startswith("sqlite"):
        # Parse db file path
        db_file = db_url.replace("sqlite:///", "")
        if not os.path.exists(db_file):
            return  # db doesn't exist yet, nothing to back up
            
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            # Check if accounts table exists and contains any accounts
            try:
                res = conn.execute(text("SELECT COUNT(*) FROM accounts"))
                count = res.scalar()
                if not count or count == 0:
                    # Database has no accounts (is empty)
                    engine.dispose()
                    return
            except Exception:
                # Table accounts does not exist yet (first startup), skip backup
                engine.dispose()
                return
        engine.dispose()

        # If we reach here, database is NOT empty. Check if backup already exists
        if db_url.startswith("sqlite"):
            backup_path = os.path.join(backup_dir, f"backup_{current_month}.db")
            if os.path.exists(backup_path):
                return  # already backed up this month
                
            db_file = db_url.replace("sqlite:///", "")
            shutil.copy2(db_file, backup_path)
            print(f"[BACKUP] SQLite monthly backup saved to: {backup_path}")
        else:
            backup_path = os.path.join(backup_dir, f"backup_{current_month}.sql")
            if os.path.exists(backup_path):
                return  # already backed up this month

            # Parse PostgreSQL connection
            parsed = urlparse(db_url)
            db_name = parsed.path.lstrip('/')
            db_user = parsed.username or "postgres"
            db_password = parsed.password or ""
            db_host = parsed.hostname or "localhost"
            db_port = parsed.port or 5432

            # Configure environment password for pg_dump
            env = os.environ.copy()
            if db_password:
                env["PGPASSWORD"] = db_password

            cmd = [
                "pg_dump",
                "-h", db_host,
                "-p", str(db_port),
                "-U", db_user,
                "-f", backup_path,
                db_name
            ]
            
            # Execute backup process
            subprocess.run(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            print(f"[BACKUP] PostgreSQL monthly backup saved to: {backup_path}")

    except Exception as e:
        print(f"[BACKUP WARNING] Monthly backup skipped or failed: {e}")
