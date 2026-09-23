def water_change(before_area: float, after_area: float) -> float:
    if before_area == 0:
        return 0.0
    return round(((after_area - before_area) / before_area) * 100, 2)
