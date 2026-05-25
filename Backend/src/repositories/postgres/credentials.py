from src.config.postgres import AsyncSessionLocal
from src.models.postgres.credentials import Creds
from sqlalchemy.future import select
from typing import Dict, Any, List, Optional


class CredentialsRepo:

    @staticmethod
    async def add_device_cred(cred: Dict[str, Any]) -> Dict[str, Any]:
        session = None
        try:
            mac_address = cred.get("mac_address")
            if not mac_address:
                return {"success": False, "reason": "mac_address is required and must be discovered before saving"}

            session = AsyncSessionLocal()
            async with session as db_session:
                obj = Creds(**cred)
                db_session.add(obj)
                await db_session.commit()
                await db_session.refresh(obj)
                return {"success": True, "id": obj.id}
        except Exception as e:
            if session is not None:
                await session.rollback()
            return {"success": False, "reason": str(e)}


    @staticmethod
    async def get_all_cred() -> List[Dict[str, Any]]:
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Creds))
                items = res.scalars().all()
                return [ {"id": i.id, "device_type": i.device_type, "mac_address": i.mac_address, "ip": i.ip, "username": i.username, "password": i.password, "secret": i.secret, "snmp_password": i.snmp_password} for i in items ]
        except Exception as e:
            return []


    @staticmethod
    async def get_one_cred(ip: str) -> Optional[Dict[str, Any]]:
        try:
            async with AsyncSessionLocal() as session:
                q = select(Creds).where(Creds.ip == ip)
                res = await session.execute(q)
                item = res.scalar_one_or_none()
                if item:
                    return {"id": item.id, "device_type": item.device_type, "mac_address": item.mac_address, "ip": item.ip, "username": item.username, "password": item.password, "secret": item.secret, "snmp_password": item.snmp_password}
                return None
        except Exception as e:
            return None


    @staticmethod
    async def get_all_ip_and_snmp() -> List[Dict[str, Any]]:
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Creds.ip, Creds.snmp_password))
                rows = res.all()
                return [{"ip": r[0], "snmp_password": r[1]} for r in rows]
        except Exception as e:
            return []


    @staticmethod
    async def get_mac_from_ip(ip: str) -> Optional[str]:
        """
        Get MAC address for a device by its IP address.
        Queries the credentials table which has the direct IP-MAC mapping.
        """
        try:
            cred = await CredentialsRepo.get_one_cred(ip)
            if cred:
                return cred.get("mac_address")
            return None
        except Exception as e:
            print(f"Error in get_mac_from_ip for IP {ip}: {e}")
            return None
