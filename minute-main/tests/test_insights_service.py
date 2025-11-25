from common.services.insights_service import compute_insights


class DummyTranscription:
    def __init__(self, entries):
        self.dialogue_entries = entries


class DummyMinuteVersion:
    def __init__(self, html):
        self.html_content = html


class DummyMinute:
    def __init__(self, versions):
        self.minute_versions = versions


def test_compute_insights_basic():
    transcriptions = [
        DummyTranscription([{"end_time": 120.0}]),  # 2 minutes audio
        DummyTranscription([{"end_time": 60.0}]),  # 1 minute audio
    ]
    minutes = [
        DummyMinute([DummyMinuteVersion("<p>Safety plan agreed safety review</p>")])
    ]

    metrics = compute_insights(transcriptions, minutes)

    assert metrics.audio_minutes == 3.0
    # manual typing factor 4x => saved = duration*(4-1) = 9 minutes
    assert metrics.time_saved_minutes == 9.0
    assert metrics.transcription_count == 2
    assert metrics.minute_count == 1
    assert metrics.avg_audio_minutes == 1.5
    assert metrics.topics[0][0] == "safety"
