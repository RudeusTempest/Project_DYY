from sqlalchemy.ext.asyncio import  async_sessionmaker, create_async_engine
from .settings import settings

postgres_url = settings.postgres_url

 
engine = create_async_engine(
    postgres_url,
    pool_pre_ping=True,
    echo=False,  # enable/disable SQL logging for debugging
)

 
AsyncSessionLocal = async_sessionmaker( 
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)
 







