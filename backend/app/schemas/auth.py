from pydantic import BaseModel, EmailStr, Field


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class SendPhoneOTPRequest(BaseModel):
    phone: str = Field(pattern=r"^(?:\d{10}|\+[1-9]\d{9,14})$")


class VerifyPhoneOTPRequest(BaseModel):
    phone: str = Field(pattern=r"^(?:\d{10}|\+[1-9]\d{9,14})$")
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class VerifyOTPResponse(BaseModel):
    message: str
    reset_token: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str = Field(min_length=32)
    new_password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str
