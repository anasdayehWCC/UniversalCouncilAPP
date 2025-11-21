import logging
import re
import tempfile
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable
from uuid import UUID

from sqlalchemy.orm import selectinload

from common.database.postgres_database import SessionLocal
from common.database.postgres_models import ExportStatus, JobStatus, Minute, MinuteVersion
from common.metrics import export_latency_seconds, export_status_total
from common.services.msgraph_client import MSGraphClient
from common.services.storage_services import get_storage_service
from common.settings import get_settings
from worker.exporters.docx_exporter import build_docx
from worker.exporters.pdf_exporter import build_pdf

settings = get_settings()
logger = logging.getLogger(__name__)


@dataclass
class ExportArtifact:
    format: str
    local_path: Path
    storage_key: str
    sharepoint_item_id: str | None = None


class ExportHandlerService:
    """Handles minute export generation and downstream fan-out.

    Runs inside the worker context to avoid blocking request handlers (AGENTS rule 3).
    """

    @classmethod
    async def export_minute_version(cls, minute_version_id: UUID, formats: Iterable[str] | None = None) -> None:
        formats = list(formats or ["docx", "pdf"])
        started_at = datetime.now(tz=UTC)
        with SessionLocal() as session:
            minute_version = session.get(
                MinuteVersion,
                minute_version_id,
                options=[
                    selectinload(MinuteVersion.minute).selectinload(Minute.transcription),
                    selectinload(MinuteVersion.minute).selectinload(Minute.case),
                ],
            )
            if not minute_version:
                logger.warning("MinuteVersion %s not found for export", minute_version_id)
                return
            if minute_version.status != JobStatus.COMPLETED:
                logger.info("MinuteVersion %s not yet completed; skipping export", minute_version_id)
                return
            minute = minute_version.minute
            minute.export_status = ExportStatus.IN_PROGRESS
            minute.last_exported_at = datetime.now(tz=UTC)
            session.add(minute)
            session.commit()

            minute_id = minute.id
            organisation_id = minute.organisation_id
            service_domain_id = minute.service_domain_id
            html_content = minute_version.html_content

        artifacts: list[ExportArtifact] = []
        storage_service = get_storage_service(settings.STORAGE_SERVICE_NAME)
        storage_prefix = settings.EXPORT_STORAGE_PREFIX.rstrip("/")

        try:
            for fmt in formats:
                with tempfile.TemporaryDirectory() as tmpdir:
                    output_path = Path(tmpdir) / f"minute-{minute.id}.{fmt}"
                    if fmt == "docx":
                        build_docx(minute_version=minute_version, output_path=output_path)
                        storage_key = f"{storage_prefix}/{organisation_id}/{minute_id}/minutes.docx"
                    elif fmt == "pdf":
                        build_pdf(minute_version=minute_version, output_path=output_path)
                        storage_key = f"{storage_prefix}/{organisation_id}/{minute_id}/minutes.pdf"
                    else:
                        logger.warning("Unsupported export format requested: %s", fmt)
                        continue
                    await storage_service.upload(storage_key, output_path)
                    artifacts.append(ExportArtifact(format=fmt, local_path=output_path, storage_key=storage_key))
                    export_latency_seconds.labels(format=fmt).observe(
                        (datetime.now(tz=UTC) - started_at).total_seconds()
                    )

            if settings.MS_GRAPH_ENABLED and artifacts:
                await cls._upload_to_sharepoint(minute_version, artifacts, service_domain_id=service_domain_id)

            with SessionLocal() as session:
                minute = session.get(Minute, minute_id)
                if not minute:
                    return
                for artifact in artifacts:
                    match artifact.format:
                        case "docx":
                            minute.docx_blob_path = artifact.storage_key
                            minute.sharepoint_docx_item_id = artifact.sharepoint_item_id
                        case "pdf":
                            minute.pdf_blob_path = artifact.storage_key
                            minute.sharepoint_pdf_item_id = artifact.sharepoint_item_id
                # Planner tasks
                tasks = cls._extract_actions(html_content)
                if settings.MS_GRAPH_ENABLED and tasks:
                    planner_client = MSGraphClient()
                    planner_ids = await planner_client.create_planner_tasks(tasks, minute)
                    minute.planner_task_ids = planner_ids
                minute.export_status = ExportStatus.COMPLETED
                minute.export_error = None
                minute.last_exported_at = datetime.now(tz=UTC)
                session.add(minute)
                session.commit()
                for artifact in artifacts:
                    export_status_total.labels(status="success", format=artifact.format).inc()
        except Exception as exc:  # noqa: BLE001
            logger.exception("Export failed for minute_version %s", minute_version_id)
            with SessionLocal() as session:
                minute = session.get(Minute, minute.id)
                if minute:
                    minute.export_status = ExportStatus.FAILED
                    minute.export_error = str(exc)
                    session.add(minute)
                    session.commit()
            for fmt in formats:
                export_status_total.labels(status="failed", format=fmt).inc()

    @classmethod
    async def _upload_to_sharepoint(
        cls, minute_version: MinuteVersion, artifacts: list[ExportArtifact], service_domain_id: UUID | None
    ) -> None:
        client = MSGraphClient()
        domain_subpath = None
        if service_domain_id:
            domain_subpath = settings.MS_GRAPH_DOMAIN_LIBRARY_PATHS.get(str(service_domain_id))
        prefix = settings.MS_GRAPH_LIBRARY_PATH.strip("/")
        base_path = f"{prefix}/{domain_subpath}" if domain_subpath else prefix
        for artifact in artifacts:
            remote_path = f"{base_path}/minute-{minute_version.minute.id}.{artifact.format}"
            item_id = await client.upload_file(artifact.local_path, remote_path)
            artifact.sharepoint_item_id = item_id

    @staticmethod
    def _extract_actions(html_content: str | None) -> list[str]:
        if not html_content:
            return []
        actions: list[str] = []
        for match in re.finditer(r"(?im)^[-*]?\s*(action[s]?:\s*)(.+)$", html_content):
            actions.append(match.group(2).strip())
        # fallback: capture bullet list items containing "to "
        if not actions:
            for match in re.finditer(r"<li>(.*?)</li>", html_content, flags=re.IGNORECASE | re.DOTALL):
                text = re.sub("<[^<]+?>", " ", match.group(1)).strip()
                if len(text) > 0:
                    actions.append(text)
        return actions[:10]
