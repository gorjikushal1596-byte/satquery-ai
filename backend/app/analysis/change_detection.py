def calculate_change(before: float, after: float) -> float:
    if before == 0:
        return 0.0
    return round(((after - before) / abs(before)) * 100, 2)
