from typing import Any

from common.database.postgres_models import DialogueEntry

TOO_MANY_REQUESTS = 429


def speaker_from_entry(entry: dict[str, Any]) -> str:
    if "channel" in entry:
        return f"Channel {entry['channel']}"
    if "channelNumber" in entry:
        return f"Channel {entry['channelNumber']}"
    if "speaker" in entry:
        return str(entry["speaker"])
    return "Speaker"


def convert_to_dialogue_entries(phrases: list[dict[str, Any]]) -> list[DialogueEntry]:
    return [
        DialogueEntry(
            speaker=speaker_from_entry(entry),
            text=entry["text"],
            start_time=float(entry["offsetMilliseconds"]) / 1000,
            end_time=(float(entry["offsetMilliseconds"]) + float(entry["durationMilliseconds"])) / 1000,
            canonical_speaker=None,
        )
        for entry in phrases
    ]
