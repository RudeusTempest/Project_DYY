from fastapi import FastAPI
from src.middleware.cors import setup_cors
from src.routes import devices, credentials

def create_app() -> FastAPI:
    app = FastAPI(title="Project DYY API", version="1.0.0")

    # Middleware
    setup_cors(app)

    # Routes
    app.include_router(devices.router, prefix="/devices", tags=["devices"])
    app.include_router(credentials.router, prefix="/credentials", tags=["credentials"])
    return app

app = create_app()