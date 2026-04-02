from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets
from jose import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    # bcrypt requires bytes; limit to 72 bytes to avoid bcrypt limitation
    # although bcrypt itself handles this, passlib was throwing a ValueError
    # we'll encode and hash directly.
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(subject: str, extra_claims: dict | None = None, expires_minutes: int | None = None) -> str:
    settings = get_settings()
    payload = {'sub': subject}
    if extra_claims:
        payload.update(extra_claims)
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes or settings.jwt_access_token_expire_minutes)
    payload['exp'] = expire
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def generate_otp(length: int = 6) -> str:
    return ''.join(secrets.choice('0123456789') for _ in range(length))


def hash_otp(email: str, purpose: str, otp: str) -> str:
    settings = get_settings()
    message = f'{email.lower()}::{purpose}::{otp}'.encode('utf-8')
    return hmac.new(settings.jwt_secret_key.encode('utf-8'), message, hashlib.sha256).hexdigest()
