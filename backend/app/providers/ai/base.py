from abc import ABC, abstractmethod

class AIProvider(ABC):
    @abstractmethod
    def understand(self, query: str):
        raise NotImplementedError
