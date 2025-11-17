



def bytes_to_mbps(bytes_count: int, interval_seconds: int = 1) -> float:
    return (bytes_count * 8) / (1_000_000 * interval_seconds)