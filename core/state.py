# In-memory shared state stores for simulation labs
from typing import Dict, Any

# Shared memory stores (simulated databases)
mfa_secrets: Dict[str, str] = {}
rsa_key_pairs: Dict[str, Dict[str, Any]] = {}
jwt_secrets: Dict[str, str] = {"default": "super-secret-key-12345"}

# PKI simulation storage
pki_ca_store: Dict[str, Any] = {
    "ca_key": None,
    "ca_cert": None,
    "aa_key": None,
    "aa_cert": None,
    "issued_certs": {},     # serial_number -> cert_info
    "revoked_certs": {},    # serial_number -> revocation_info
    "issued_acs": {}        # serial_number -> ac_info
}
