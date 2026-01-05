from src.db.postgres.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, JSON
from typing import Optional
from sqlalchemy import DateTime
from datetime import datetime


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mac: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=False)
    hostname: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    interface: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    info_neighbors: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    last_updated: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    raw_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    device_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
