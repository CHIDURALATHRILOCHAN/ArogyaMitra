import asyncio
from app.services.auth_service import create_access_token, decode_token

token = create_access_token({"sub": 1, "role": "user"})
print("Generated Token:", token)
decoded = decode_token(token)
print("Decoded Payload:", decoded)
