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
from app.schemas.auth import (
    CustomerMobileResponse,
    MessageResponse,
    SendPhoneOTPRequest,
    TermsAndConditionsResponse,
    TermsSection,
    UpdateCustomerMobileRequest,
    VerifyPhoneOTPRequest,
)
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


@router.get("/terms-and-conditions", response_model=TermsAndConditionsResponse)
async def get_terms_and_conditions() -> TermsAndConditionsResponse:
    return TermsAndConditionsResponse(
        platform="Haazir",
        sections=[
            TermsSection(
                title="1. PLATFORM ROLE",
                points=[
                    "Haazir acts solely as an intermediary platform that facilitates connections between users and independent service providers.",
                    "Haazir does not directly provide any services.",
                ],
            ),
            TermsSection(
                title="2. USER RESPONSIBILITY",
                points=[
                    "Users agree to provide accurate information while booking services and are responsible for verifying service details before confirmation.",
                    "Users must ensure a safe and respectful working environment for service providers.",
                ],
            ),
            TermsSection(
                title="3. BOOKINGS",
                points=[
                    "All bookings are subject to the availability and acceptance of service providers.",
                    "Haazir does not guarantee service completion.",
                ],
            ),
            TermsSection(
                title="4. PAYMENTS & PLATFORM FEES",
                points=[
                    "Haazir may charge a platform fee of approximately 10% per booking.",
                    "Additional service or operational charges may be included within the pricing structure.",
                    "Users agree to these charges upon booking.",
                ],
            ),
            TermsSection(
                title="5. LIABILITY DISCLAIMER",
                points=[
                    "Haazir is not responsible or liable for any misconduct, fraud, or illegal activity by service providers.",
                    "Haazir is not responsible or liable for service quality or performance.",
                    "Haazir is not responsible or liable for any loss, damage, or disputes arising during or after service delivery.",
                    "All interactions are at the user's own risk.",
                ],
            ),
            TermsSection(
                title="6. SAFETY",
                points=[
                    "Users are advised to exercise caution and verify details before engaging with any service provider.",
                ],
            ),
            TermsSection(
                title="7. MISUSE OF PLATFORM",
                points=[
                    "Any fraudulent activity, abuse, or misuse of the platform may result in suspension or permanent restriction.",
                ],
            ),
            TermsSection(
                title="8. CANCELLATION",
                points=[
                    "Frequent cancellations or misuse of booking features may lead to penalties or restrictions.",
                ],
            ),
            TermsSection(
                title="9. ACCEPTANCE",
                points=[
                    "By using Haazir, the user agrees to all terms and conditions stated above.",
                ],
            ),
        ],
    )


@router.get("/provider/terms-and-conditions", response_model=TermsAndConditionsResponse)
async def get_provider_terms_and_conditions() -> TermsAndConditionsResponse:
    return TermsAndConditionsResponse(
        platform="Haazir",
        sections=[
            TermsSection(
                title="1. REGISTRATION & KYC",
                points=[
                    "All service providers must complete identity verification (KYC) before being approved on the platform.",
                    "Without successful verification, access to the platform will not be granted.",
                ],
            ),
            TermsSection(
                title="2. ACCURACY OF INFORMATION",
                points=[
                    "Service providers must provide accurate personal, professional, and contact information.",
                    "Any false information may lead to rejection or removal.",
                ],
            ),
            TermsSection(
                title="3. PLATFORM ROLE",
                points=[
                    "Haazir acts only as a connecting platform and does not employ service providers.",
                    "Providers operate independently and are responsible for their services.",
                ],
            ),
            TermsSection(
                title="4. SERVICE RESPONSIBILITY",
                points=[
                    "Service providers are fully responsible for quality of service.",
                    "Service providers are fully responsible for professional conduct.",
                    "Service providers are fully responsible for timely completion of assigned work.",
                ],
            ),
            TermsSection(
                title="5. AVAILABILITY",
                points=[
                    "Providers must update their availability status accurately.",
                    "Misrepresentation may lead to penalties or removal.",
                ],
            ),
            TermsSection(
                title="6. PLATFORM FEES",
                points=[
                    "Haazir charges a platform commission of approximately 10% per booking.",
                    "Additional operational charges may be applied as part of the platform model.",
                ],
            ),
            TermsSection(
                title="7. LIABILITY DISCLAIMER",
                points=[
                    "Haazir shall not be held responsible for disputes with users.",
                    "Haazir shall not be held responsible for payment-related conflicts.",
                    "Haazir shall not be held responsible for any legal or safety issues arising during service.",
                    "Providers operate at their own risk and responsibility.",
                ],
            ),
            TermsSection(
                title="8. MISCONDUCT",
                points=[
                    "Any fraud, unsafe behavior, or misconduct will result in immediate suspension or permanent removal from the platform.",
                ],
            ),
            TermsSection(
                title="9. COMPLIANCE",
                points=[
                    "Providers must comply with all local laws, safety standards, and ethical practices.",
                ],
            ),
            TermsSection(
                title="10. ACCEPTANCE",
                points=[
                    "By registering on Haazir, the service provider agrees to all terms and conditions stated above.",
                ],
            ),
        ],
    )


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


@router.put("/customer/mobile", response_model=CustomerMobileResponse)
async def update_customer_mobile(
    payload: UpdateCustomerMobileRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    otp_service: Annotated[OTPService, Depends(get_otp_service)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> CustomerMobileResponse:
    if current_user.get("role") != "customer":
        raise UnauthorizedException("Only customers can update mobile number")

    is_valid = await otp_service.verify_phone_otp(payload.phone, payload.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    existing_user = await user_repo.find_by_phone(payload.phone)
    if existing_user and str(existing_user.get("_id")) != current_user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone number already in use",
        )

    updated = await user_repo.update_customer_mobile(current_user["user_id"], payload.phone)
    if not updated:
        raise NotFoundException("Customer not found")
    return CustomerMobileResponse(phone=updated["phone"])


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
