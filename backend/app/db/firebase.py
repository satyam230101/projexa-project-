import firebase_admin
from pathlib import Path

from firebase_admin import credentials, firestore, storage
from fastapi import HTTPException, status

from app.core.config import get_settings

_app = None
BACKEND_ROOT = Path(__file__).resolve().parents[2]


def get_firebase_app():
    global _app
    if _app is not None:
        return _app

    settings = get_settings()
    cred = None
    try:
        if settings.firebase_credentials_path:
            cred_path = Path(settings.firebase_credentials_path)
            if not cred_path.is_absolute():
                cred_path = BACKEND_ROOT / cred_path
            cred = credentials.Certificate(str(cred_path))
        else:
            missing = []
            if not settings.firebase_project_id:
                missing.append('FIREBASE_PROJECT_ID')
            if not settings.firebase_client_email:
                missing.append('FIREBASE_CLIENT_EMAIL')
            if not settings.firebase_private_key:
                missing.append('FIREBASE_PRIVATE_KEY')

            if missing:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Firebase is not configured. Missing: {', '.join(missing)}",
                )

            private_key = settings.firebase_private_key.replace('\\n', '\n')
            cred_info = {
                'type': 'service_account',
                'project_id': settings.firebase_project_id,
                'client_email': settings.firebase_client_email,
                'private_key': private_key,
                'token_uri': 'https://oauth2.googleapis.com/token',
            }
            cred = credentials.Certificate(cred_info)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Firebase credential setup failed. Set FIREBASE_CREDENTIALS_PATH or valid FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.',
        ) from exc

    options = {}
    if settings.firebase_storage_bucket:
        options['storageBucket'] = settings.firebase_storage_bucket
    try:
        _app = firebase_admin.initialize_app(cred, options)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Firebase initialization failed. Verify service-account credentials and project access.',
        ) from exc
    return _app


def get_firestore_client():
    app = get_firebase_app()
    return firestore.client(app)


def get_storage_bucket():
    app = get_firebase_app()
    return storage.bucket(app=app)
