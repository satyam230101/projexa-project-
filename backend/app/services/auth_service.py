from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status

from app.core.security import create_access_token, generate_otp, hash_otp, hash_password, verify_password
from app.db.firebase import get_firestore_client
from app.services.email_service import EmailService


class AuthService:
    def __init__(self):
        self._db = None
        self.email_service = EmailService()

    @property
    def db(self):
        if self._db is None:
            self._db = get_firestore_client()
        return self._db

    def signup_start(self, email: str, name: str, password: str, role: str) -> dict:
        email = email.lower().strip()
        existing = self._get_user_by_email(email)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered')

        otp = generate_otp()
        otp_hash = hash_otp(email, 'signup', otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        self.db.collection('otp_verifications').document(f'signup:{email}').set({
            'email': email,
            'purpose': 'signup',
            'otp_hash': otp_hash,
            'expires_at': expires_at.isoformat(),
            'attempts': 0,
            'max_attempts': 5,
            'pending_user': {
                'name': name,
                'password_hash': hash_password(password),
                'role': role,
            },
            'updated_at': datetime.now(timezone.utc).isoformat(),
        })

        try:
            self.email_service.send_otp(email, otp, 'signup')
            return {'message': 'OTP sent to your email'}
        except Exception as e:
            print(f"EMAIL ERROR: {e}")
            # Local development fallback when email provider is not configured.
            return {'message': f'Development OTP: {otp}'}

    def signup_verify(self, email: str, otp: str) -> dict:
        email = email.lower().strip()
        doc_ref = self.db.collection('otp_verifications').document(f'signup:{email}')
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='OTP session not found')

        data = doc.to_dict()
        self._validate_otp_or_raise(email, 'signup', otp)

        pending = data['pending_user']
        user_ref = self.db.collection('users').document()
        user_ref.set({
            'id': user_ref.id,
            'email': email,
            'name': pending['name'],
            'role': pending['role'],
            'password_hash': pending['password_hash'],
            'is_email_verified': True,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        })
        doc_ref.delete()

        token = create_access_token(subject=user_ref.id, extra_claims={'email': email, 'role': pending['role']})
        return {'access_token': token, 'token_type': 'bearer'}

    def signin(self, email: str, password: str) -> dict:
        user = self._get_user_by_email(email.lower().strip())
        if not user or not verify_password(password, user.get('password_hash', '')):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

        token = create_access_token(subject=user['id'], extra_claims={'email': user['email'], 'role': user.get('role', 'patient')})
        return {'access_token': token, 'token_type': 'bearer'}

    def forgot_password_start(self, email: str) -> dict:
        email = email.lower().strip()
        user = self._get_user_by_email(email)
        if not user:
            return {'message': 'If an account exists, OTP will be sent'}

        otp = generate_otp()
        otp_hash = hash_otp(email, 'forgot_password', otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        self.db.collection('otp_verifications').document(f'forgot_password:{email}').set({
            'email': email,
            'purpose': 'forgot_password',
            'otp_hash': otp_hash,
            'expires_at': expires_at.isoformat(),
            'attempts': 0,
            'max_attempts': 5,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        })

        try:
            self.email_service.send_otp(email, otp, 'forgot_password')
            return {'message': 'If an account exists, OTP will be sent'}
        except Exception:
            return {'message': f'Development OTP: {otp}'}

    def forgot_password_verify(self, email: str, otp: str) -> dict:
        email = email.lower().strip()
        doc = self.db.collection('otp_verifications').document(f'forgot_password:{email}').get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='OTP session not found')

        self._validate_otp_or_raise(email, 'forgot_password', otp)

        reset_token = create_access_token(subject=email, extra_claims={'purpose': 'password_reset'}, expires_minutes=15)
        return {'message': 'OTP verified', 'reset_token': reset_token}

    def reset_password(self, email: str, new_password: str) -> dict:
        user = self._get_user_by_email(email.lower().strip())
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

        self.db.collection('users').document(user['id']).update({
            'password_hash': hash_password(new_password),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        })
        return {'message': 'Password updated successfully'}

    def _validate_otp_or_raise(self, email: str, purpose: str, otp: str):
        doc_ref = self.db.collection('otp_verifications').document(f'{purpose}:{email}')
        current_doc = doc_ref.get()
        if not current_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='OTP session not found')

        current = current_doc.to_dict()
        provided_hash = hash_otp(email, purpose, otp)
        expected_hash = current.get('otp_hash', '')
        now = datetime.now(timezone.utc)
        expires_at = datetime.fromisoformat(current['expires_at'])
        if now > expires_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='OTP expired')

        attempts = int(current.get('attempts', 0))
        max_attempts = int(current.get('max_attempts', 5))
        if attempts >= max_attempts:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many OTP attempts')

        if provided_hash != expected_hash:
            doc_ref.update({'attempts': attempts + 1, 'updated_at': now.isoformat()})
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid OTP')

        doc_ref.delete()

    def _get_user_by_email(self, email: str):
        docs = self.db.collection('users').where('email', '==', email).limit(1).stream()
        for doc in docs:
            return doc.to_dict()
        return None
