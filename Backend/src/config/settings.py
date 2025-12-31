from pydantic import BaseSettings

class Settings(BaseSettings):
    postgres_url: str = "postgresql+asyncpg://user:postgres@localhost/postgres"
    mongo_url: str = "mongodb://localhost:27017/"


settings = Settings()