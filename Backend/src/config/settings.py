from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    postgres_url: str 
    mongo_url: str
    conf_interval: int = 60

    class Config:
        env_file = ".env"

settings = Settings()