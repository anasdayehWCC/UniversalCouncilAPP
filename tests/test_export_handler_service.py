import asyncio

import pytest

from common.services.export_handler_service import ExportHandlerService


@pytest.mark.asyncio(loop_scope="session")
async def test_extract_actions_basic():
    html = """
    <ul>
      <li>Action: Call guardian</li>
      <li>Action: Schedule follow-up</li>
    </ul>
    """
    actions = ExportHandlerService._extract_actions(html)
    assert len(actions) == 2
    assert "Call guardian" in actions[0]


@pytest.mark.asyncio(loop_scope="session")
async def test_extract_actions_fallback_list():
    html = """
    <ol>
      <li>Complete consent form</li>
      <li>Book GP slot</li>
    </ol>
    """
    actions = ExportHandlerService._extract_actions(html)
    assert actions == ["Complete consent form", "Book GP slot"]


@pytest.mark.asyncio(loop_scope="session")
async def test_extract_actions_limits():
    html = "".join([f"<li>Action: item {i}</li>" for i in range(20)])
    actions = ExportHandlerService._extract_actions(html)
    assert len(actions) == 10  # should cap to avoid huge Planner blasts
