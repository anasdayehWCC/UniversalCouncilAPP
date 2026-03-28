from pathlib import Path

from weasyprint import HTML

from common.database.postgres_models import MinuteVersion


def _build_header(minute_version: MinuteVersion) -> str:
    minute = minute_version.minute
    if not minute:
        return ""
    tags = ", ".join(minute.tags) if getattr(minute, "tags", None) else "–"
    case_ref = minute.case_reference or "–"
    visit_type = minute.visit_type or "–"
    return f"""
    <div style="padding:12px 0; border-bottom:1px solid #e2e8f0; margin-bottom:12px; font-size:12px; color:#475569;">
      <div><strong>Template:</strong> {minute.template_name}</div>
      <div><strong>Case reference:</strong> {case_ref}</div>
      <div><strong>Visit type:</strong> {visit_type}</div>
      <div><strong>Tags:</strong> {tags}</div>
    </div>
    """


def build_pdf(minute_version: MinuteVersion, output_path: Path) -> Path:
    body = minute_version.html_content or "<p>No minutes available</p>"
    html_content = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #0f172a;">
      {_build_header(minute_version)}
      {body}
    </div>
    """
    HTML(string=html_content).write_pdf(output_path)
    return output_path
