# db/postgres/session.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from config.postgres import DATABASE_URL

# Create the async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    future=True
)

# Async session factory
async_session = sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession
)

# Correct async generator to yield a session
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
