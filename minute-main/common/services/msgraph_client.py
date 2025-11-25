import base64
import logging
from datetime import UTC
from pathlib import Path
from typing import Iterable

import httpx
from azure.identity.aio import DefaultAzureCredential

from common.database.postgres_models import MinuteTask
from common.settings import get_settings
from common.services.circuit_breaker import breaker

settings = get_settings()
logger = logging.getLogger(__name__)


class MSGraphClient:
    def __init__(self) -> None:
        self.credential = DefaultAzureCredential(
            managed_identity_client_id=settings.AZURE_MANAGED_IDENTITY_CLIENT_ID,
            exclude_environment_credential=False,
        )

    async def _get_token(self) -> str:
        token = await self.credential.get_token("https://graph.microsoft.com/.default")
        return token.token

    async def upload_file(self, local_path: Path, remote_path: str) -> str | None:
        if not settings.MS_GRAPH_ENABLED:
            return None
        access_token = await self._get_token()
        url = (
            f"https://graph.microsoft.com/v1.0/drives/{settings.MS_GRAPH_DRIVE_ID}/root:/{remote_path}:/content"
        )
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/octet-stream"}
        async with breaker.guard("ms_graph"):
            async with httpx.AsyncClient(timeout=30) as client, local_path.open("rb") as f:
                resp = await client.put(url, headers=headers, content=f)
                if resp.is_success:
                    data = resp.json()
                    return data.get("id")
                logger.error("Graph upload failed: %s", resp.text)
                return None

    async def create_planner_tasks(self, tasks: Iterable[MinuteTask], minute) -> list[str]:
        if not settings.MS_GRAPH_ENABLED or not settings.MS_GRAPH_PLAN_ID or not settings.MS_GRAPH_BUCKET_ID:
            return []
        access_token = await self._get_token()
        url = "https://graph.microsoft.com/v1.0/planner/tasks"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        plan_id = settings.MS_GRAPH_DOMAIN_PLAN_IDS.get(str(minute.service_domain_id), settings.MS_GRAPH_PLAN_ID)
        bucket_id = settings.MS_GRAPH_BUCKET_ID
        assignee = settings.MS_GRAPH_ASSIGN_USER_ID
        created_ids: list[str] = []
        async with breaker.guard("ms_graph"):
            async with httpx.AsyncClient(timeout=20) as client:
                for task in tasks:
                    description = (task.description or "Action").strip()
                    payload = {
                        "planId": plan_id,
                        "bucketId": bucket_id,
                        "title": description[:250],
                        "details": {
                            "previewType": "automatic",
                            "description": f"Minute {minute.id} action item",
                        },
                    }
                    if task.due_date:
                        due_dt = task.due_date
                        if due_dt.tzinfo is None:
                            due_dt = due_dt.replace(tzinfo=UTC)
                        iso_due = due_dt.astimezone(UTC).isoformat()
                        payload["dueDateTime"] = {
                            "dateTime": iso_due,
                            "timeZone": "UTC",
                        }
                    if task.owner:
                        payload["details"]["description"] = f"Owner: {task.owner}\nSource minute: {minute.id}"
                    if assignee:
                        payload["assignments"] = {
                            assignee: {"@odata.type": "microsoft.graph.plannerAssignment", "orderHint": " !"}
                        }
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.is_success:
                        created_ids.append(resp.json().get("id"))
                    else:
                        logger.warning("Planner task creation failed: %s", resp.text)
        return created_ids
