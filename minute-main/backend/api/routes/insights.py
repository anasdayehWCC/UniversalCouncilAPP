from fastapi import APIRouter

from backend.api.dependencies import SQLSessionDep, UserDep
from common.services.insights_service import compute_insights, load_insights_data
from common.types import InsightsResponse, TopicTrend

insights_router = APIRouter(tags=["Insights"])


@insights_router.get("/insights", response_model=InsightsResponse)
async def get_insights(session: SQLSessionDep, user: UserDep) -> InsightsResponse:
    transcriptions, minutes = await load_insights_data(
        session,
        organisation_id=user.organisation_id,
        service_domain_id=user.service_domain_id,
    )
    metrics = compute_insights(transcriptions, minutes)
    return InsightsResponse(
        status="ok",
        audio_minutes=metrics.audio_minutes,
        time_saved_minutes=metrics.time_saved_minutes,
        transcription_count=metrics.transcription_count,
        minute_count=metrics.minute_count,
        avg_audio_minutes=metrics.avg_audio_minutes,
        topics=[TopicTrend(topic=t, count=c) for t, c in metrics.topics],
    )
