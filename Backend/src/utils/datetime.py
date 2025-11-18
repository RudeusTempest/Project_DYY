from datetime import datetime
from typing import Tuple


def now_formatted(fmt: str = "%d-%m-%Y %H:%M:%S") -> Tuple[datetime, str]:
    raw_date = datetime.now()
    return raw_date, raw_date.strftime(fmt)