from fastapi.middleware.cors import CORSMiddleware


# Add CORS middleware
def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React default ports
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )