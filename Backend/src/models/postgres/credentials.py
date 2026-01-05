from src.db.postgres.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String
from typing import Optional

class Creds(Base):
    __tablename__ = "credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_type: Mapped[str] = mapped_column(String(50), nullable=False)
    mac_address: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    ip: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    password: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    secret: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    snmp_password: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
