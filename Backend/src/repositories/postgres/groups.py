from src.config.postgres import AsyncSessionLocal
from src.models.postgres.groups import Groups
from sqlalchemy.future import select
from typing import Dict, Any, List, Optional


class GroupsRepo:

    @staticmethod
    async def add_group(group_name: Dict[str, Any]) -> Dict[str, Any]:
        try:
            async with AsyncSessionLocal() as session:
                q = select(Groups).where(Groups.group == group_name.get("group"))
                res = await session.execute(q)
                existing = res.scalar_one_or_none()
                if existing:
                    return {"success": False, "reason": "Group already exists"}
                obj = Groups(group=group_name.get("group"), device_macs=group_name.get("device_macs", []))
                session.add(obj)
                await session.commit()
                return {"success": True, "message": "Group added successfully"}
        except Exception as e:
            try:
                await session.rollback()
            except Exception:
                pass
            return {"success": False, "reason": str(e)}


    @staticmethod
    async def assign_device_to_group(device_mac: str, group_name: str) -> Dict[str, Any]:
        try:
            async with AsyncSessionLocal() as session:
                q = select(Groups).where(Groups.group == group_name)
                res = await session.execute(q)
                group = res.scalar_one_or_none()
                if not group:
                    return {"success": False, "reason": "Group not found"}
                # add to set behaviour
                macs = group.device_macs or []
                if device_mac not in macs:
                    macs.append(device_mac)
                    group.device_macs = macs
                    session.add(group)
                    await session.commit()
                return {"success": True, "message": "Device assigned to group successfully"}
        except Exception as e:
            try:
                await session.rollback()
            except Exception:
                pass
            return {"success": False, "reason": str(e)}


    @staticmethod
    async def get_one_group(group_name: str) -> Optional[Dict[str, Any]]:
        try:
            async with AsyncSessionLocal() as session:
                q = select(Groups).where(Groups.group == group_name)
                res = await session.execute(q)
                g = res.scalar_one_or_none()
                if g:
                    return {"group": g.group, "device_macs": g.device_macs or []}
                return None
        except Exception:
            return None


    @staticmethod
    async def get_all_groups() -> List[Dict[str, Any]]:
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Groups))
                items = res.scalars().all()
                return [{"group": i.group, "device_macs": i.device_macs or []} for i in items]
        except Exception:
            return []


    @staticmethod
    async def delete_device_from_group(device_mac: str, group_name: str) -> Dict[str, Any]:
        try:
            async with AsyncSessionLocal() as session:
                q = select(Groups).where(Groups.group == group_name)
                res = await session.execute(q)
                group = res.scalar_one_or_none()
                if not group:
                    return {"success": False, "reason": "Group not found"}
                macs = group.device_macs or []
                if device_mac in macs:
                    macs = [m for m in macs if m != device_mac]
                    group.device_macs = macs
                    session.add(group)
                    await session.commit()
                return {"success": True, "message": "Device removed from group successfully"}
        except Exception as e:
            try:
                await session.rollback()
            except Exception:
                pass
            return {"success": False, "reason": str(e)}


    @staticmethod
    async def delete_group(group_name: str) -> Dict[str, Any]:
        try:
            async with AsyncSessionLocal() as session:
                q = select(Groups).where(Groups.group == group_name)
                res = await session.execute(q)
                group = res.scalar_one_or_none()
                if not group:
                    return {"success": False, "reason": "Group not found"}
                await session.delete(group)
                await session.commit()
                return {"success": True, "message": "Group deleted successfully"}
        except Exception as e:
            try:
                await session.rollback()
            except Exception:
                pass
            return {"success": False, "reason": str(e)}
