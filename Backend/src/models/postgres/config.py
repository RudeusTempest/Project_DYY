from src.db.postgres.base import Base
from sqlalchemy import (Column, Integer, String, Boolean, DateTime, Text, UniqueConstraint, ForeignKey)


class Config(Base):
    __tablename__ = "config"

    id = Column(Integer, primary_key=True)
    mac_address = Column(String(100), ForeignKey("devices.mac"), nullable=False, unique=True)
    configuration = Column(Text, nullable=False) 
    queried_at = Column(DateTime, nullable=False)


class ConfigArchive(Base):
    __tablename__ = "config_archive"

    id = Column(Integer, primary_key=True)
    mac_address = Column(String(100), ForeignKey("devices.mac"), nullable=False)
    configuration = Column(Text, nullable=False)
    queried_at = Column(DateTime, nullable=False)
