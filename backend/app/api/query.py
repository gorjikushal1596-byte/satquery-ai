from fastapi import APIRouter
from app.schemas.query import QueryRequest
from app.services.orchestration import orchestrate_query

router = APIRouter(prefix="/query", tags=["query"])

@router.post("")
def query(request: QueryRequest):
    return orchestrate_query(request.query)
