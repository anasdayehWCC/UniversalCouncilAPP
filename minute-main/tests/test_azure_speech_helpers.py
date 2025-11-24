import copy

from common.services.transcription_services.azure_common import convert_to_dialogue_entries, speaker_from_entry
from common.services.transcription_services.lexicon import build_phrase_list, settings


def test_speaker_from_entry_prefers_channel():
    entry = {"channel": 1, "text": "hello", "offsetMilliseconds": 0, "durationMilliseconds": 1000}
    assert speaker_from_entry(entry) == "Channel 1"


def test_convert_to_dialogue_entries_uses_channel_label():
    phrases = [
        {"channel": 0, "text": "hi", "offsetMilliseconds": 0, "durationMilliseconds": 500},
        {"speaker": 2, "text": "hey", "offsetMilliseconds": 500, "durationMilliseconds": 500},
    ]
    entries = convert_to_dialogue_entries(phrases)
    assert entries[0]["speaker"] == "Channel 0"
    assert entries[1]["speaker"] == "2"


def test_build_phrase_list_merges_default_and_domain():
    original_global = copy.deepcopy(settings.AZURE_SPEECH_PHRASE_LIST)
    original_by_domain = copy.deepcopy(settings.AZURE_SPEECH_PHRASE_LIST_BY_DOMAIN)
    original_bias = settings.AZURE_SPEECH_PHRASE_LIST_BIAS
    try:
        settings.AZURE_SPEECH_PHRASE_LIST = ["alpha", "beta"]
        settings.AZURE_SPEECH_PHRASE_LIST_BY_DOMAIN = {"service-domain-id": ["beta", "gamma"]}
        settings.AZURE_SPEECH_PHRASE_LIST_BIAS = 1.5

        phrase_list = build_phrase_list("service-domain-id")
        assert phrase_list == {"phrases": ["alpha", "beta", "gamma"], "biasingWeight": 1.5}
    finally:
        settings.AZURE_SPEECH_PHRASE_LIST = original_global
        settings.AZURE_SPEECH_PHRASE_LIST_BY_DOMAIN = original_by_domain
        settings.AZURE_SPEECH_PHRASE_LIST_BIAS = original_bias
