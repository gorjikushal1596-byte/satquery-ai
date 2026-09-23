from typing import Any
from pydantic import BaseModel

class QueryResult(BaseModel):
    query: str
    intent: str
    region: str
    analysis: dict[str, Any]
    confidence: float
    explanation: str
