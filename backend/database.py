from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Configure engine dynamically with automatic fallback
try:
    if settings.database_url.startswith("sqlite"):
        engine = create_engine(
            settings.database_url,
            connect_args={"check_same_thread": False}
        )
    else:
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
    import sys
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
