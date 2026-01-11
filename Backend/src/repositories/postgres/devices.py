from src.config.postgres import AsyncSessionLocal
from src.models.postgres.device import Device
from sqlalchemy.future import select
from typing import Any, Dict, List, Optional
# Import the Mongo devices repo to store interface-level details
from src.repositories.mongo.devices import DevicesRepo as MongoDevicesRepo


class DevicesRepo:

    @staticmethod
    async def save_info(mac_address: str, hostname: str, interface_data: list, last_updated: str, raw_date: Any, device_type: str = "unknown", info_neighbors: Optional[list] = None) -> None:
        """
        Save top-level device info (mac, hostname, device_type, timestamps, neighbors, status) in Postgres.
        The interfaces themselves are saved in Mongo and keyed by the Postgres device id.
        """
        try:
            async with AsyncSessionLocal() as session:
                q = select(Device).where(Device.mac == mac_address)
                res = await session.execute(q)
                existing = res.scalar_one_or_none()
                if existing:
                    # Update top-level fields only (do NOT store interfaces in Postgres)
                    existing.hostname = hostname
                    existing.last_updated = last_updated
                    existing.raw_date = raw_date
                    existing.device_type = device_type
                    existing.info_neighbors = info_neighbors
                    existing.status = "active"
                    session.add(existing)
                    await session.commit()
                    device_id = existing.id
                else:
                    obj = Device(mac=mac_address, hostname=hostname, last_updated=last_updated, raw_date=raw_date, device_type=device_type, info_neighbors=info_neighbors, status="active")
                    session.add(obj)
                    await session.commit()
                    # Refresh to get id
                    device_id = obj.id

            # Save interfaces in Mongo and link them to the Postgres device id
            try:
                await MongoDevicesRepo.save_interfaces(device_id, interface_data, last_updated, raw_date)
            except Exception:
                # Don't fail the whole operation if Mongo write fails; log in real app
                pass

        except Exception as e:
            # rollback if session in error
            try:
                await session.rollback()
            except Exception:
                pass
            raise


    @staticmethod
    async def get_all_records() -> List[Dict[str, Any]]:
        """Return combined records: postgres fields merged with interfaces from Mongo."""
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Device))
                items = res.scalars().all()

            result = []
            # For simplicity make parallel calls to Mongo per device; could be optimized
            for i in items:
                interfaces = []
                try:
                    doc = await MongoDevicesRepo.get_interfaces_by_device_id(i.id)
                    if doc:
                        interfaces = doc.get("interface", [])
                except Exception:
                    interfaces = []

                result.append({
                    "mac": i.mac,
                    "hostname": i.hostname,
                    "interface": interfaces,
                    "info_neighbors": i.info_neighbors,
                    "last updated at": i.last_updated,
                    "raw date": i.raw_date,
                    "device_type": i.device_type,
                    "status": i.status
                })
            return result
        except Exception:
            return []


    @staticmethod
    async def get_one_record(ip: str) -> List[Dict[str, Any]]:
        """Find device(s) that have an interface with the given IP address.
        This queries Mongo to find matching interface(s), then fetches top-level device info from Postgres."""
        try:
            matches = []
            # Find matching interface docs in Mongo
            try:
                docs = await MongoDevicesRepo.find_by_interface_ip(ip)
            except Exception:
                docs = []

            if not docs:
                return []

            # For each matching doc, fetch corresponding Postgres device
            async with AsyncSessionLocal() as session:
                for doc in docs:
                    device_id = doc.get("device_id")
                    if not device_id:
                        continue
                    q = select(Device).where(Device.id == device_id)
                    res = await session.execute(q)
                    device = res.scalar_one_or_none()
                    if device:
                        matches.append({
                            "mac": device.mac,
                            "hostname": device.hostname,
                            "interface": doc.get("interface", []),
                            "info_neighbors": device.info_neighbors,
                            "last updated at": device.last_updated,
                            "raw date": device.raw_date,
                            "device_type": device.device_type,
                            "status": device.status
                        })
            return matches
        except Exception:
            return []


    @staticmethod
    async def get_interface_data() -> List[Dict[str, Any]]:
        """Return interfaces for all devices by delegating to Mongo."""
        try:
            return await MongoDevicesRepo.get_interface_data()
        except Exception:
            return []


    @staticmethod
    async def update_mbps(ip: str, mbps_received: float, mbps_sent: float) -> None:
        """Update interface Mbps in Mongo (where interfaces live)."""
        try:
            await MongoDevicesRepo.update_mbps(ip, mbps_received, mbps_sent)
        except Exception:
            return


    @staticmethod
    async def flag_device_inactive(mac_address: str) -> None:
        try:
            async with AsyncSessionLocal() as session:
                q = select(Device).where(Device.mac == mac_address)
                res = await session.execute(q)
                item = res.scalar_one_or_none()
                if item:
                    item.status = "inactive"
                    session.add(item)
                    await session.commit()
        except Exception:
            return


    @staticmethod
    async def update_bandwidth_cli(device_ip: str, bandwidth_data: dict) -> Optional[Dict[str, Any]]:
        """Delegate bandwidth updates to Mongo and return a combined object with Postgres fields."""
        try:
            # Update Mongo and get the updated interface list and device_id
            updated = await MongoDevicesRepo.update_bandwidth_cli(device_ip, bandwidth_data)
            if not updated:
                return None

            device_id = updated.get("device_id")
            interfaces = updated.get("interface", [])

            # Fetch Postgres device to combine top-level fields
            async with AsyncSessionLocal() as session:
                q = select(Device).where(Device.id == device_id)
                res = await session.execute(q)
                device = res.scalar_one_or_none()
                if not device:
                    return None

                return {
                    "mac": device.mac,
                    "hostname": device.hostname,
                    "interface": interfaces,
                    "last updated at": device.last_updated,
                    "raw date": device.raw_date,
                    "device_type": device.device_type,
                    "status": device.status
                }
        except Exception:
            return None
