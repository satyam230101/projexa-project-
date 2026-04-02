from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_ROOT / '.env'


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), env_file_encoding='utf-8', case_sensitive=False)

    app_name: str = 'Telemedicine Backend'
    app_env: str = 'development'
    app_host: str = '0.0.0.0'
    app_port: int = 8000
    frontend_origin: str = 'http://localhost:5173'
    frontend_origins: str | None = None

    jwt_secret_key: str
    jwt_algorithm: str = 'HS256'
    jwt_access_token_expire_minutes: int = 120

    firebase_project_id: str
    firebase_client_email: str
    firebase_private_key: str
    firebase_storage_bucket: str | None = None
    firebase_credentials_path: str | None = None

    email_provider: str = 'resend'
    email_from: str
    resend_api_key: str | None = None
    sendgrid_api_key: str | None = None

    openrouter_api_key: str | None = None
    openrouter_model: str = 'openai/gpt-4o-mini'
    openrouter_site_url: str = 'http://localhost:5173'
    openrouter_site_name: str = 'Telemedicine App'

    search_provider: str = 'auto'
    tavily_api_key: str | None = None
    serpapi_api_key: str | None = None
    trusted_guideline_sources: str = 'who.int,aiims.edu,medlineplus.gov,cdc.gov,nice.org.uk'

    video_meeting_provider: str = 'jitsi'
    video_meeting_base_url: str = 'https://meet.jit.si'
    video_meeting_room_prefix: str = 'mediplus'

    @property
    def allowed_origins(self) -> list[str]:
        """Compatibility accessor consumed by app.main CORS setup."""
        if self.frontend_origins:
            return [origin.strip() for origin in self.frontend_origins.split(',') if origin.strip()]
        return [self.frontend_origin]


@lru_cache
def get_settings() -> Settings:
    return Settings()
