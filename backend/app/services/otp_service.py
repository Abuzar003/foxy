import secrets
from hmac import compare_digest

from app.core.cache import LocalCache

class OTPService:
    OTP_TTL_SECONDS = 300
    RESET_TOKEN_TTL_SECONDS = 900
    # Dev bypass: accepted for any email/phone OTP check without reading cache.
    DEV_OTP_BYPASS = "000000"

    def __init__(self, cache_client: LocalCache) -> None:
        self.cache_client = cache_client

    @staticmethod
    def _otp_key(email: str) -> str:
        return f"otp:{email.lower()}"

    @staticmethod
    def _reset_token_key(email: str) -> str:
        return f"reset_token:{email.lower()}"

    @staticmethod
    def _phone_otp_key(phone: str) -> str:
        return f"phone_otp:{phone}"

    def generate_otp(self) -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    def generate_reset_token(self) -> str:
        return secrets.token_urlsafe(32)

    async def create_otp(self, email: str) -> str:
        otp = self.generate_otp()
        await self.cache_client.set(
            self._otp_key(email),
            otp,
            ttl_seconds=self.OTP_TTL_SECONDS,
        )
        await self.cache_client.delete(self._reset_token_key(email))
        return otp

    async def verify_otp(self, email: str, otp: str) -> bool:
        if otp == self.DEV_OTP_BYPASS:
            await self.cache_client.delete(self._otp_key(email))
            return True
        cached_otp = await self.cache_client.get(self._otp_key(email))
        if not cached_otp:
            return False
        is_valid = compare_digest(cached_otp, otp)
        if is_valid:
            # One-time OTP use to prevent replay attacks.
            await self.cache_client.delete(self._otp_key(email))
        return is_valid

    async def create_phone_otp(self, phone: str) -> str:
        otp = self.generate_otp()
        await self.cache_client.set(
            self._phone_otp_key(phone),
            otp,
            ttl_seconds=self.OTP_TTL_SECONDS,
        )
        return otp

    async def verify_phone_otp(self, phone: str, otp: str) -> bool:
        if otp == self.DEV_OTP_BYPASS:
            await self.cache_client.delete(self._phone_otp_key(phone))
            return True
        key = self._phone_otp_key(phone)
        cached_otp = await self.cache_client.get(key)
        if not cached_otp:
            return False
        is_valid = compare_digest(cached_otp, otp)
        if is_valid:
            await self.cache_client.delete(key)
        return is_valid

    async def create_reset_token(self, email: str) -> str:
        token = self.generate_reset_token()
        await self.cache_client.set(
            self._reset_token_key(email),
            token,
            ttl_seconds=self.RESET_TOKEN_TTL_SECONDS,
        )
        return token

    async def validate_reset_token(self, email: str, reset_token: str) -> bool:
        cached_token = await self.cache_client.get(self._reset_token_key(email))
        if not cached_token:
            return False
        return compare_digest(cached_token, reset_token)

    async def delete_reset_token(self, email: str) -> None:
        await self.cache_client.delete(self._reset_token_key(email))
