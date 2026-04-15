from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared rate limiter instance — keyed by client IP.
# Import this in both main.py (to register with the app)
# and in any router that needs a limit decorator.
limiter = Limiter(key_func=get_remote_address)
