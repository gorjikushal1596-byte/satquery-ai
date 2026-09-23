from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.query import router as query_router
from app.api.imagery import router as imagery_router
from app.api.health import router as health_router

app = FastAPI(title="SatQuery AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(query_router, prefix="/api")
app.include_router(imagery_router, prefix="/api")

@app.get("/")
def root():
    return {"name": "SatQuery AI", "status": "running"}
