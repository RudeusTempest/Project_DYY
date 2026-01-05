from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from src.config.postgres import AsyncSessionLocal

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_session_instance() -> AsyncSession:
    async for session in get_session():
        return session