from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
from urllib.parse import urlparse
import sys

def create_postgres_db_if_missing(url: str):
    """Connects to the default 'postgres' database and creates the target database if missing."""
    if not url.startswith("postgresql"):
        return
    
    parsed = urlparse(url)
    target_db = parsed.path.lstrip('/')
    if not target_db:
        return
        
    # Connect to the default 'postgres' database to check/create the target database
    base_url = url.replace(f"/{target_db}", "/postgres")
    temp_engine = create_engine(base_url, isolation_level="AUTOCOMMIT")
    try:
        with temp_engine.connect() as conn:
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{target_db}'"))
            exists = result.scalar()
            if not exists:
                print(f"Programmatic DB check: '{target_db}' database not found. Creating...", file=sys.stderr)
                conn.execute(text(f"CREATE DATABASE {target_db}"))
                print(f"Programmatic DB check: '{target_db}' database created successfully.", file=sys.stderr)
    except Exception as e:
        print(f"Programmatic DB check warning: could not verify/create database: {e}", file=sys.stderr)
    finally:
        temp_engine.dispose()


# Configure engine dynamically with automatic fallback
try:
    if settings.database_url.startswith("sqlite"):
        engine = create_engine(
            settings.database_url,
            connect_args={"check_same_thread": False}
        )
    else:
        # Check and create database if missing on PostgreSQL
        create_postgres_db_if_missing(settings.database_url)
        
        engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
    # Test connection immediately
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"\n[WARNING] Database connection failed: {e}", file=sys.stderr)
    print("[WARNING] Falling back to local SQLite database: sqlite:///./tradeflo.db\n", file=sys.stderr)
    engine = create_engine(
        "sqlite:///./tradeflo.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for FastAPI routes — yields a DB session and closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
