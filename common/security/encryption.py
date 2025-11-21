import logging
from datetime import date
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from common.settings import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


def _get_fernet() -> Optional[Fernet]:
    if not settings.PII_ENCRYPTION_KEY:
        if settings.ENVIRONMENT != "local":
            raise RuntimeError("PII_ENCRYPTION_KEY is required outside local environments for PII encryption")
        logger.warning("PII_ENCRYPTION_KEY not set; skipping subject_dob encryption in local mode")
        return None
    try:
        return Fernet(settings.PII_ENCRYPTION_KEY.encode())
    except ValueError as exc:
        raise RuntimeError("Invalid PII_ENCRYPTION_KEY; must be base64-encoded 32-byte key") from exc


def encrypt_date(value: Optional[date]) -> Optional[str]:
    if value is None:
        return None
    fernet = _get_fernet()
    if not fernet:
        return None
    return fernet.encrypt(value.isoformat().encode()).decode()


def decrypt_date(value: Optional[str]) -> Optional[date]:
    if value is None:
        return None
    fernet = _get_fernet()
    if not fernet:
        return None
    try:
        plaintext = fernet.decrypt(value.encode()).decode()
        return date.fromisoformat(plaintext)
    except InvalidToken:
        logger.warning("Failed to decrypt subject_dob ciphertext; returning None")
        return None
