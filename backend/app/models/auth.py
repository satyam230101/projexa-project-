from pydantic import BaseModel, EmailStr, Field


class SignupStartRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default='patient')


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=4, max_length=8)


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordStartRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class MessageResponse(BaseModel):
    message: str
