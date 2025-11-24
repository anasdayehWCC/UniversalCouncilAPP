from datetime import UTC

from common.services.task_extraction_service import TaskExtractionService


def test_extract_candidates_from_html_list():
    html = """
    <ul>
      <li>Action: Call guardian by 12/12/2025</li>
      <li>Social worker to arrange school visit</li>
    </ul>
    """
    candidates = TaskExtractionService.extract_candidates(html)
    assert len(candidates) == 2
    assert candidates[0].description == "Call guardian by 12/12/2025"
    assert candidates[1].owner_role == "social_worker"


def test_extract_candidates_parses_due_dates():
    html = "<li>Manager to submit report by 05/01/2026</li>"
    candidates = TaskExtractionService.extract_candidates(html)
    assert len(candidates) == 1
    assert candidates[0].due_date is not None
    assert candidates[0].due_date.tzinfo == UTC
    assert candidates[0].due_date.year == 2026


def test_extract_candidates_deduplicates_items():
    html = """
    <li>Action: Follow up with GP</li>
    <li>Action: Follow up with GP</li>
    """
    candidates = TaskExtractionService.extract_candidates(html)
    assert len(candidates) == 1
