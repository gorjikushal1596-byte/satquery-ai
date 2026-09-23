def ndvi(nir: float, red: float) -> float:
    denominator = nir + red
    return 0.0 if denominator == 0 else round((nir - red) / denominator, 4)
