from datetime import datetime

def now_formatted(fmt="%d-%m-%Y %H:%M:%S"):
    raw_date = datetime.now()
    return raw_date, raw_date.strftime(fmt)