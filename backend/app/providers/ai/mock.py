from .base import AIProvider

class MockAIProvider(AIProvider):
    def understand(self, query: str):
        return {"intent": "general_satellite_query", "confidence": 0.75}
