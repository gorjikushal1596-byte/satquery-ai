from fastapi import APIRouter
from app.providers.satellite.mock import MockSatelliteProvider

router = APIRouter(prefix="/imagery", tags=["imagery"])
provider = MockSatelliteProvider()

@router.get("/search")
def search_imagery(region: str = "Andhra Pradesh", start_year: int = 2023, end_year: int = 2025):
    return provider.search_imagery(region, start_year, end_year)
