import re

def parse_query(query: str):
    q = query.lower()

    if any(x in q for x in ["vegetation", "ndvi", "crop", "greenery"]):
        intent = "vegetation_change"
    elif any(x in q for x in ["water", "lake", "river", "flood"]):
        intent = "water_analysis"
    elif any(x in q for x in ["building", "urban", "city", "built-up"]):
        intent = "urban_analysis"
    elif any(x in q for x in ["change", "compare", "difference"]):
        intent = "change_detection"
    else:
        intent = "general_satellite_query"

    regions = ["andhra pradesh", "vijayawada", "hyderabad", "india"]
    region = next((r.title() for r in regions if r in q), "Demo Region")

    years = [int(x) for x in re.findall(r"\b20\d{2}\b", q)]
    if len(years) >= 2:
        start_year, end_year = min(years), max(years)
    elif len(years) == 1:
        start_year, end_year = years[0], years[0]
    else:
        start_year, end_year = 2023, 2025

    return {
        "intent": intent,
        "region": region,
        "start_year": start_year,
        "end_year": end_year,
        "query": query,
    }
