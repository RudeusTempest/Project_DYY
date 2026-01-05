from src.db.postgres.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, JSON
from typing import Optional

class Groups(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    device_macs: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
