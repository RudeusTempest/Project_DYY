from fastapi import FastAPI
from src.middleware.cors import setup_cors
from src.routes import devices, credentials, groups
from src.config.postgres import engine
from src.db.postgres.base import Base
from src.models.postgres.config import Config, ConfigArchive
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create Postgres tables without Alembic
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        yield
    finally:
        await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(title="Project DYY API", version="1.0.0", lifespan=lifespan)

    # Middleware
    setup_cors(app)

    # Routes
    app.include_router(devices.router, prefix="/devices", tags=["devices"])
    app.include_router(credentials.router, prefix="/credentials", tags=["credentials"])
    app.include_router(groups.router, prefix="/groups", tags=["groups"])
    return app

app = create_app()
