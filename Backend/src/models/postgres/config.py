from src.db.postgres.base import Base
from sqlalchemy import (Column, Integer, String, Boolean, DateTime, Text, UniqueConstraint)


class Config(Base):
    __tablename__ = "config"

    id = Column(Integer, primary_key=True)
    configuration = Column(String, nullable=False) 
    queried_at = Column(DateTime, nullable=False)


class ConfigArchive(Base):
    __tablename__ = "config_archive"

    id = Column(Integer, primary_key=True)
    configuration = Column(String, nullable=False)
    queried_at = Column(DateTime, nullable=False)
