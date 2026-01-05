from src.config.postgres import AsyncSessionLocal
from src.models.postgres.device import Device
from sqlalchemy.future import select
from typing import Any, Dict, List, Optional


class DevicesRepo:

    @staticmethod
    async def save_info(mac_address: str, hostname: str, interface_data: list, last_updated: str, raw_date: Any, device_type: str = "unknown", info_neighbors: Optional[list] = None) -> None:
        try:
            async with AsyncSessionLocal() as session:
                q = select(Device).where(Device.mac == mac_address)
                res = await session.execute(q)
                existing = res.scalar_one_or_none()
                if existing:
                    # Update fields
                    existing.hostname = hostname
                    existing.interface = interface_data
                    existing.last_updated = last_updated
                    existing.raw_date = raw_date
                    existing.device_type = device_type
                    existing.info_neighbors = info_neighbors
                    existing.status = "active"
                    session.add(existing)
                    await session.commit()
                else:
                    obj = Device(mac=mac_address, hostname=hostname, interface=interface_data, last_updated=last_updated, raw_date=raw_date, device_type=device_type, info_neighbors=info_neighbors, status="active")
                    session.add(obj)
                    await session.commit()
        except Exception as e:
            # rollback if session in error
            try:
                await session.rollback()
            except Exception:
                pass
            raise


    @staticmethod
    async def get_all_records() -> List[Dict[str, Any]]:
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Device))
                items = res.scalars().all()
                result = []
                for i in items:
                    result.append({
                        "mac": i.mac,
                        "hostname": i.hostname,
                        "interface": i.interface or [],
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
        try:
            records = await DevicesRepo.get_all_records()
            matches = []
            for record in records:
                for interface in record.get("interface", []):
                    if interface.get("ip_address") == ip:
                        matches.append(record)
                        break
            return matches
        except Exception:
            return []


    @staticmethod
    async def get_interface_data() -> List[Dict[str, Any]]:
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Device.interface))
                rows = res.scalars().all()
                return [{"interface": r or []} for r in rows]
        except Exception:
            return []


    @staticmethod
    async def update_mbps(ip: str, mbps_received: float, mbps_sent: float) -> None:
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Device))
                items = res.scalars().all()
                for i in items:
                    updated = False
                    if i.interface:
                        for iface in i.interface:
                            if iface.get("ip_address") == ip:
                                iface["mbps_received"] = mbps_received
                                iface["mbps_sent"] = mbps_sent
                                updated = True
                        if updated:
                            session.add(i)
                            await session.commit()
                            return
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
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Device))
                items = res.scalars().all()
                device = None
                for i in items:
                    if i.interface:
                        for iface in i.interface:
                            if iface.get("ip_address") == device_ip:
                                device = i
                                break
                    if device:
                        break

                if not device:
                    return None

                for interface in device.interface or []:
                    interface_name = interface.get("interface")
                    if interface_name and interface_name in bandwidth_data:
                        interface["bandwidth"] = bandwidth_data[interface_name]

                # save
                session.add(device)
                await session.commit()

                return {
                    "mac": device.mac,
                    "hostname": device.hostname,
                    "interface": device.interface,
                    "last updated at": device.last_updated,
                    "raw date": device.raw_date,
                    "device_type": device.device_type,
                    "status": device.status
                }
        except Exception:
            return None
