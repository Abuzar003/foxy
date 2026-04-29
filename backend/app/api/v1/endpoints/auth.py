from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_auth_service, get_otp_service
from app.schemas.auth import MessageResponse, SendPhoneOTPRequest, VerifyPhoneOTPRequest
from app.schemas.user import AuthResponse, CustomerCreate, LoginRequest, ProviderCreate
from app.services.auth_service import AuthService
from app.services.otp_service import OTPService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register/customer",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_customer(
    payload: CustomerCreate,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    return await auth_service.register_customer(payload)


@router.post(
    "/register/provider",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_provider(
    payload: ProviderCreate,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    return await auth_service.register_provider(payload)


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    return await auth_service.login(payload)


@router.post("/send-phone-otp", response_model=MessageResponse)
async def send_phone_otp(
    payload: SendPhoneOTPRequest,
    otp_service: Annotated[OTPService, Depends(get_otp_service)],
) -> MessageResponse:
    otp = await otp_service.create_phone_otp(payload.phone)
    print(f"[MOCK_SMS] Phone OTP for {payload.phone}: {otp}")
    return MessageResponse(message="Phone OTP sent")


@router.post("/verify-phone-otp", response_model=MessageResponse)
async def verify_phone_otp(
    payload: VerifyPhoneOTPRequest,
    otp_service: Annotated[OTPService, Depends(get_otp_service)],
) -> MessageResponse:
    is_valid = await otp_service.verify_phone_otp(payload.phone, payload.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )
    return MessageResponse(message="Phone OTP verified")
