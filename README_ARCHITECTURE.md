# SatQuery AI — Architecture Prototype

This version preserves the existing frontend and adds an architecture-friendly FastAPI backend.

## Run backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API:
- GET `/api/health`
- POST `/api/query`
- GET `/api/imagery/search`

Example query body:

```json
{"query":"Show vegetation change in Andhra Pradesh between 2023 and 2025"}
```

The prototype uses mock satellite/AI providers so it works without external API credentials.

## Frontend

Open `frontend/index.html` in a browser, or serve the folder with a local static server.

The existing UI is intentionally preserved. The backend can be connected through the existing frontend API adapter.
