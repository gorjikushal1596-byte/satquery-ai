from app.services.query_service import parse_query
from app.services.analysis_service import analyze

def orchestrate_query(query: str):
    plan = parse_query(query)
    result = analyze(plan)
    return {
        "query": query,
        "intent": plan["intent"],
        "region": plan["region"],
        "analysis": result["analysis"],
        "confidence": result["confidence"],
        "explanation": result["explanation"],
        "provider": "mock",
        "next_step": "Replace mock providers with real satellite/AI providers."
    }
