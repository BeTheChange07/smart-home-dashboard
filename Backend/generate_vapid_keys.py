"""
Run this ONCE to generate VAPID keys for Web Push notifications.
Add the output values to your .env file.

Usage:
    pip install pywebpush cryptography
    python generate_vapid_keys.py

Then copy the output into your .env file.
"""

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
import base64

private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())

raw_private = private_key.private_numbers().private_value.to_bytes(32, byteorder="big")
private_b64 = base64.urlsafe_b64encode(raw_private).decode().rstrip("=")

raw_public = private_key.public_key().public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
public_b64 = base64.urlsafe_b64encode(raw_public).decode().rstrip("=")

print("\n=== Add these to your .env file ===\n")
print(f'VAPID_PRIVATE_KEY="{private_b64}"')
print(f'VAPID_PUBLIC_KEY="{public_b64}"')
print(f'VAPID_EMAIL="your-email@example.com"')