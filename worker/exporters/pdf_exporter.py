from pathlib import Path

from weasyprint import HTML

from common.database.postgres_models import MinuteVersion


def build_pdf(minute_version: MinuteVersion, output_path: Path) -> Path:
    html_content = minute_version.html_content or "<p>No minutes available</p>"
    HTML(string=html_content).write_pdf(output_path)
    return output_path
