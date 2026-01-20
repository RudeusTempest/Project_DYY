from src.config.postgres import AsyncSessionLocal
from src.models.postgres.config import Config, ConfigArchive
from sqlalchemy.future import select
from typing import Any, Dict, List, Optional
from datetime import datetime


class ConfigRepo:

    @staticmethod
    async def save_config(mac_address: str, configuration: str, queried_at: datetime) -> None:
        """
        Save device configuration. If a configuration already exists for this MAC address,
        archive the old one first before saving the new one.
        """
        try:
            async with AsyncSessionLocal() as session:
                # Check if a config already exists for this MAC
                q = select(Config).where(Config.mac_address == mac_address)
                res = await session.execute(q)
                existing_config = res.scalar_one_or_none()
                
                if existing_config:
                    # Archive the old configuration
                    archive_entry = ConfigArchive(
                        mac_address=mac_address,
                        configuration=existing_config.configuration,
                        queried_at=existing_config.queried_at
                    )
                    session.add(archive_entry)
                    
                    # Update the existing config with new data
                    existing_config.configuration = configuration
                    existing_config.queried_at = queried_at
                    session.add(existing_config)
                else:
                    # Create new config entry
                    new_config = Config(
                        mac_address=mac_address,
                        configuration=configuration,
                        queried_at=queried_at
                    )
                    session.add(new_config)
                
                await session.commit()
                print(f"Successfully saved configuration for device {mac_address}")
                
        except Exception as e:
            print(f"Error saving configuration for device {mac_address}: {e}")
            try:
                await session.rollback()
            except Exception:
                pass
            raise


    @staticmethod
    async def get_latest_config(mac_address: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve the latest configuration for a device by MAC address.
        """
        try:
            async with AsyncSessionLocal() as session:
                q = select(Config).where(Config.mac_address == mac_address)
                res = await session.execute(q)
                config = res.scalar_one_or_none()
                
                if config:
                    return {
                        "id": config.id,
                        "mac_address": config.mac_address,
                        "configuration": config.configuration,
                        "queried_at": config.queried_at
                    }
                return None
        except Exception as e:
            print(f"Error retrieving configuration for device {mac_address}: {e}")
            return None


    @staticmethod
    async def get_config_history(mac_address: str) -> List[Dict[str, Any]]:
        """
        Retrieve all archived configurations for a device (configuration history).
        """
        try:
            async with AsyncSessionLocal() as session:
                q = select(ConfigArchive).where(ConfigArchive.mac_address == mac_address).order_by(ConfigArchive.queried_at.desc())
                res = await session.execute(q)
                archives = res.scalars().all()
                
                return [
                    {
                        "id": archive.id,
                        "mac_address": archive.mac_address,
                        "configuration": archive.configuration,
                        "queried_at": archive.queried_at
                    }
                    for archive in archives
                ]
        except Exception as e:
            print(f"Error retrieving configuration history for device {mac_address}: {e}")
            return []


    @staticmethod
    async def delete_old_archives(mac_address: str, keep_count: int = 10) -> None:
        """
        Keep only the most recent N archived configurations for a device.
        Older archives are deleted permanently.
        """
        try:
            async with AsyncSessionLocal() as session:
                q = select(ConfigArchive).where(ConfigArchive.mac_address == mac_address).order_by(ConfigArchive.archived_at.desc())
                res = await session.execute(q)
                archives = res.scalars().all()
                
                # Delete archives beyond the keep_count
                if len(archives) > keep_count:
                    to_delete = archives[keep_count:]
                    for archive in to_delete:
                        await session.delete(archive)
                    await session.commit()
                    print(f"Deleted {len(to_delete)} old configuration archives for {mac_address}")
        except Exception as e:
            print(f"Error cleaning up old archives for device {mac_address}: {e}")
            try:
                await session.rollback()
            except Exception:
                pass
