from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import (
    get_auth_service,
    get_current_user,
    get_otp_service,
    get_user_repository,
)
from app.core.exceptions import NotFoundException, UnauthorizedException
from app.repositories.user_repository import UserRepository
from app.schemas.auth import MessageResponse, SendPhoneOTPRequest, VerifyPhoneOTPRequest
from app.schemas.user import (
    AuthResponse,
    CustomerPreferenceResponse,
    CustomerPreferenceUpdate,
    CustomerCreate,
    LoginRequest,
    ProviderAboutResponse,
    ProviderAboutUpdate,
    ProviderCreate,
)
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


@router.get("/provider/about", response_model=ProviderAboutResponse)
async def get_provider_about(
    current_user: Annotated[dict, Depends(get_current_user)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> ProviderAboutResponse:
    if current_user.get("role") != "provider":
        raise UnauthorizedException("Only providers can access this page")

    user = await user_repo.find_by_id(current_user["user_id"])
    if not user:
        raise NotFoundException("Provider not found")

    return ProviderAboutResponse(
        aadhaar_number=user.get("aadhaar_number"),
        pan_card=user.get("pan_card"),
        address=user.get("address"),
        services=user.get("services", []),
        price_per_day=user.get("price_per_day"),
        price_per_hour=user.get("price_per_hour"),
        profile_photo=user.get("profile_photo"),
        about=user.get("about"),
        age=user.get("age"),
    )


@router.put("/provider/about", response_model=ProviderAboutResponse)
async def update_provider_about(
    payload: ProviderAboutUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> ProviderAboutResponse:
    if current_user.get("role") != "provider":
        raise UnauthorizedException("Only providers can update this page")

    updated = await user_repo.update_provider_profile(
        current_user["user_id"],
        payload.model_dump(),
    )
    if not updated:
        raise NotFoundException("Provider not found")

    return ProviderAboutResponse(
        aadhaar_number=updated.get("aadhaar_number"),
        pan_card=updated.get("pan_card"),
        address=updated.get("address"),
        services=updated.get("services", []),
        price_per_day=updated.get("price_per_day"),
        price_per_hour=updated.get("price_per_hour"),
        profile_photo=updated.get("profile_photo"),
        about=updated.get("about"),
        age=updated.get("age"),
    )


@router.get("/customer/preferences", response_model=CustomerPreferenceResponse)
async def get_customer_preferences(
    current_user: Annotated[dict, Depends(get_current_user)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> CustomerPreferenceResponse:
    if current_user.get("role") != "customer":
        raise UnauthorizedException("Only customers can access this page")

    user = await user_repo.find_by_id(current_user["user_id"])
    if not user:
        raise NotFoundException("Customer not found")

    return CustomerPreferenceResponse(
        home_age=user.get("home_age"),
        family_size=user.get("family_size"),
        grooming_cycle_days=user.get("grooming_cycle_days"),
    )


@router.put("/customer/preferences", response_model=CustomerPreferenceResponse)
async def update_customer_preferences(
    payload: CustomerPreferenceUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> CustomerPreferenceResponse:
    if current_user.get("role") != "customer":
        raise UnauthorizedException("Only customers can update this page")

    updated = await user_repo.update_customer_preferences(
        current_user["user_id"],
        payload.model_dump(),
    )
    if not updated:
        raise NotFoundException("Customer not found")

    return CustomerPreferenceResponse(
        home_age=updated.get("home_age"),
        family_size=updated.get("family_size"),
        grooming_cycle_days=updated.get("grooming_cycle_days"),
    )
