from src.config.postgres import AsyncSessionLocal
from src.models.postgres.white_list import WhiteList
from sqlalchemy.future import select
from typing import Any, Dict, List, Optional, Tuple



class WhiteListRepo:
    
    @staticmethod
    async def add_words(new_words: str) -> Dict[str, Any]:
        """
        Save device configuration. If a configuration already exists for this MAC address,
        archive the old one first before saving the new one.
        """
        try:
            async with AsyncSessionLocal() as session:
                # Create new entry
                new_words = WhiteList(
                words = new_words,
                )
                session.add(new_words)
                
                await session.commit()
                print(f"Successfully saved configuration for device {new_words}")
                return {"success": True, "message": "words added successfully"}
        except Exception as e:
            print(f"Error saving configuration for device {new_words}: {e}")
            try:
                await session.rollback()
            except Exception:
                pass
            raise