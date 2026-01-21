from src.config.postgres import AsyncSessionLocal
from src.models.postgres.config import Config, ConfigArchive
from sqlalchemy.future import select
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
from src.repositories.postgres.credentials import CredentialsRepo


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


    @staticmethod
    async def get_config_differences(ip: str) -> Optional[List[List[str]]]:
        """
        Compares the latest configuration with the most recent archived configuration.
        
        Args:
            ip: The IP address of the device
            
        Returns:
            A list containing two lists: [added_lines, deleted_lines]
            - added_lines: Lines that exist in the current config but not in the archived config
            - deleted_lines: Lines that exist in the archived config but not in the current config
            Returns None if either config cannot be retrieved or if there's an error.
        """
        try:
            # Convert IP to MAC address
            mac_address = await CredentialsRepo.get_mac_from_ip(ip)
            if not mac_address:
                print(f"Could not find MAC address for IP: {ip}")
                return None
            
            # Get the latest current configuration
            async with AsyncSessionLocal() as session:
                q = select(Config).where(Config.mac_address == mac_address)
                res = await session.execute(q)
                current_config = res.scalar_one_or_none()
                
                if not current_config:
                    print(f"No current configuration found for MAC: {mac_address}")
                    return None
                
                current_config_text = current_config.configuration
            
            # Get the latest archived configuration
            async with AsyncSessionLocal() as session:
                q = select(ConfigArchive).where(ConfigArchive.mac_address == mac_address).order_by(ConfigArchive.queried_at.desc())
                res = await session.execute(q)
                latest_archive = res.scalars().first()
                
                if not latest_archive:
                    print(f"No archived configuration found for MAC: {mac_address}")
                    return None
                
                archived_config_text = latest_archive.configuration
            
            # Split configurations into lists of lines
            current_lines = current_config_text.split('\n') if current_config_text else []
            archived_lines = archived_config_text.split('\n') if archived_config_text else []
            
            # Strip whitespace from each line for comparison
            current_lines = [line.strip() for line in current_lines if line.strip()]
            archived_lines = [line.strip() for line in archived_lines if line.strip()]
            
            # Create mutable copies for comparison
            current_lines_copy = current_lines.copy()
            archived_lines_copy = archived_lines.copy()
            
            # Compare and remove matching lines
            for line in current_lines:
                if line in archived_lines_copy:
                    current_lines_copy.remove(line)
                    archived_lines_copy.remove(line)
            
            # current_lines_copy now contains added lines (in current but not in archive)
            # archived_lines_copy now contains deleted lines (in archive but not in current)
            added_lines = current_lines_copy
            deleted_lines = archived_lines_copy

            return [added_lines, deleted_lines]
            
        except Exception as e:
            print(f"Error comparing configurations for IP {ip}: {e}")
            return None
