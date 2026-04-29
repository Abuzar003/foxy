class EmailService:
    async def send_otp_email(self, recipient_email: str, otp: str) -> None:
        print(f"[MOCK EMAIL] Sent to {recipient_email}: Your OTP is {otp}")
