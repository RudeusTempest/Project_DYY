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

    @staticmethod
    async def get_white_list() -> List[Dict[str, Any]]:
        """
        Get all words from the white list.
        """
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(WhiteList))
                words = result.scalars().all()
                return [{"id": word.id, "words": word.words} for word in words]
        except Exception as e:
            print(f"Error retrieving words: {e}")
            raise

    @staticmethod
    async def delete_words(word_id: int) -> Dict[str, Any]:
        """
        Delete a word entry by id.
        """
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(WhiteList).where(WhiteList.id == word_id))
                word = result.scalar_one_or_none()
                if word:
                    await session.delete(word)
                    await session.commit()
                    return {"success": True, "message": "word deleted successfully"}
                else:
                    return {"success": False, "message": "word not found"}
        except Exception as e:
            print(f"Error deleting word: {e}")
            try:
                await session.rollback()
            except Exception:
                pass
            raise