from fastapi import APIRouter, HTTPException, status
from jose import JWTError

from app.core.security import decode_token
from app.models.auth import (
    AuthResponse,
    ForgotPasswordStartRequest,
    MessageResponse,
    OtpVerifyRequest,
    ResetPasswordRequest,
    SigninRequest,
    SignupStartRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix='/api/auth', tags=['auth'])
service = AuthService()


@router.post('/signup/start', response_model=MessageResponse)
def signup_start(payload: SignupStartRequest):
    data = service.signup_start(payload.email, payload.name, payload.password, payload.role)
    return MessageResponse(**data)


@router.post('/signup/verify', response_model=AuthResponse)
def signup_verify(payload: OtpVerifyRequest):
    data = service.signup_verify(payload.email, payload.otp)
    return AuthResponse(**data)


@router.post('/signin', response_model=AuthResponse)
def signin(payload: SigninRequest):
    data = service.signin(payload.email, payload.password)
    return AuthResponse(**data)


@router.post('/forgot-password/start', response_model=MessageResponse)
def forgot_password_start(payload: ForgotPasswordStartRequest):
    data = service.forgot_password_start(payload.email)
    return MessageResponse(**data)


@router.post('/forgot-password/verify')
def forgot_password_verify(payload: OtpVerifyRequest):
    return service.forgot_password_verify(payload.email, payload.otp)


@router.post('/reset-password', response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest):
    try:
        claims = decode_token(payload.reset_token)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid reset token') from exc

    if claims.get('purpose') != 'password_reset':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid token purpose')

    email = claims.get('sub')
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid token subject')

    data = service.reset_password(email=email, new_password=payload.new_password)
    return MessageResponse(**data)
