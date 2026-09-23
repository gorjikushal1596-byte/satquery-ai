from abc import ABC, abstractmethod

class SatelliteProvider(ABC):
    @abstractmethod
    def search_imagery(self, region, start_year, end_year):
        raise NotImplementedError
