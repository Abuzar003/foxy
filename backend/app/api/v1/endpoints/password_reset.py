from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies import (
    get_email_service,
    get_otp_service,
    get_user_repository,
)
from app.core.exceptions import UnauthorizedException
from app.core.security import hash_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    VerifyOTPRequest,
    VerifyOTPResponse,
)
from app.services.email_service import EmailService
from app.services.otp_service import OTPService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    otp_service: Annotated[OTPService, Depends(get_otp_service)],
    email_service: Annotated[EmailService, Depends(get_email_service)],
) -> MessageResponse:
    user = await user_repo.find_by_email(payload.email)
    if user:
        otp = await otp_service.create_otp(payload.email)
        await email_service.send_otp_email(payload.email, otp)

    return MessageResponse(message="If email exists, OTP sent")


@router.post("/verify-otp", response_model=VerifyOTPResponse, status_code=status.HTTP_200_OK)
async def verify_otp(
    payload: VerifyOTPRequest,
    otp_service: Annotated[OTPService, Depends(get_otp_service)],
) -> VerifyOTPResponse:
    is_valid = await otp_service.verify_otp(payload.email, payload.otp)
    if not is_valid:
        raise UnauthorizedException("Invalid or expired OTP")

    reset_token = await otp_service.create_reset_token(payload.email)
    return VerifyOTPResponse(
        message="OTP verified successfully.",
        reset_token=reset_token,
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
async def reset_password(
    payload: ResetPasswordRequest,
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    otp_service: Annotated[OTPService, Depends(get_otp_service)],
) -> MessageResponse:
    is_valid_token = await otp_service.validate_reset_token(
        payload.email,
        payload.reset_token,
    )
    if not is_valid_token:
        raise UnauthorizedException("Invalid or expired reset token")

    await user_repo.update_password(
        payload.email,
        hash_password(payload.new_password),
    )
    await otp_service.delete_reset_token(payload.email)
    return MessageResponse(message="Password reset completed.")
