from src.db.postgres.base import Base
from sqlalchemy import (Column, Integer, String, Boolean, DateTime, Text, UniqueConstraint, ForeignKey)


class WhiteList(Base):
    __tablename__ = "white_list"
    
    id = Column(Integer, primary_key=True)
    words = Column(Text, nullable=False) 
