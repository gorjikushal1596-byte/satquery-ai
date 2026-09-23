from .base import SatelliteProvider

class MockSatelliteProvider(SatelliteProvider):
    def search_imagery(self, region, start_year, end_year):
        return {
            "provider": "mock",
            "region": region,
            "start_year": start_year,
            "end_year": end_year,
            "scenes": [
                {"id": "DEMO-001", "date": f"{start_year}-06-15", "cloud_cover": 7},
                {"id": "DEMO-002", "date": f"{end_year}-06-18", "cloud_cover": 5},
            ],
        }
