import os
import pyotp
import robin_stocks.robinhood as r
from dotenv import load_dotenv

load_dotenv()

_logged_in = False


def login():
    global _logged_in
    if _logged_in:
        return

    mfa_secret = os.getenv("RH_MFA_SECRET", "")
    mfa_code = pyotp.TOTP(mfa_secret).now() if mfa_secret else None

    r.login(
        username=os.environ["RH_EMAIL"],
        password=os.environ["RH_PASSWORD"],
        store_session=True,
        mfa_code=mfa_code,
    )
    _logged_in = True


def logout():
    global _logged_in
    r.logout()
    _logged_in = False
