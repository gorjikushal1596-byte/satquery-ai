# SatQuery AI — Team Task Specification

## 1. Purpose

This document is the single source of truth for the six-member prototype implementation.

The current repository is an architecture prototype. The backend uses deterministic mock satellite and AI providers so the demo can run without external credentials. Team members must preserve the provider abstraction and API contracts while implementing their assigned work.

## 2. Team Branches

| Member | Branch | Ownership |
|---|---|---|
| M1 | `feature/query-ai` | Natural-language query understanding and orchestration |
| M2 | `feature/backend-api` | FastAPI routes, schemas, backend service contracts |
| M3 | `feature/geospatial` | Satellite provider abstraction and remote-sensing analysis |
| M4 | `feature/ai-vlm` | AI/VLM provider abstraction and result explanation |
| M5 | `feature/frontend` | Web UI, API integration, map/results presentation |
| M6 | `feature/testing-integration` | Tests, integration checks, documentation and release readiness |

## 3. Global Rules

1. Work only on the assigned branch.
2. Do not rewrite another member's files unless the change is required for integration and is discussed with that member.
3. Keep existing mock providers working. The prototype must remain runnable without paid/external credentials.
4. Keep provider interfaces separate from business logic.
5. Do not hard-code secrets, API keys, tokens, or credentials.
6. Keep API responses JSON-serializable and stable.
7. Prefer small, focused commits.
8. Before opening a PR, pull/rebase the latest `main` if the team lead requests it and run the available tests.
9. Do not merge directly into `main` from a member branch.
10. A PR should explain what changed, how it was tested, and any integration assumptions.

## 4. Member 1 — Query AI

### Branch
`feature/query-ai`

### Primary files
- `backend/app/services/query_service.py`
- `backend/app/services/orchestration.py`
- `backend/app/schemas/query.py` when query schema changes are necessary

### Goal
Turn a user's natural-language satellite question into a structured analysis plan.

### Required behavior
Extract, where available:
- user query
- intent / analysis type
- region or location
- start year
- end year
- requested feature such as vegetation, water, urban/built-up area, or generic change
- ambiguity/missing information where relevant

Preserve the existing supported intents unless there is a clear reason to extend them:
- `vegetation_change`
- `water_analysis`
- `urban_analysis`
- `change_detection`
- `general_satellite_query`

### Acceptance criteria
- Existing example query still works.
- Queries without a recognized region still receive a safe fallback.
- Year extraction does not crash on malformed input.
- The parser returns a predictable structure.
- Orchestration passes the structured plan to analysis instead of embedding parsing logic elsewhere.
- Mock mode continues to work without an LLM key.

### Do not own
- Satellite API implementation
- Frontend styling
- AI/VLM provider implementation

## 5. Member 2 — Backend API

### Branch
`feature/backend-api`

### Primary files
- `backend/main.py`
- `backend/app/api/health.py`
- `backend/app/api/query.py`
- `backend/app/api/imagery.py`
- `backend/app/schemas/query.py`
- `backend/app/schemas/result.py`

### Goal
Provide clean, predictable HTTP APIs for the frontend and future real providers.

### Required endpoints
- `GET /api/health`
- `POST /api/query`
- `GET /api/imagery/search`

### Acceptance criteria
- FastAPI starts successfully.
- Health endpoint returns a simple healthy status.
- Query endpoint accepts JSON containing `query`.
- Imagery search accepts region and year parameters with safe defaults.
- Response models are clear and validation errors are understandable.
- CORS/configuration is handled safely if required by the frontend.
- API code does not contain satellite-analysis algorithms.

### Do not own
- Natural-language parsing algorithm
- Remote-sensing calculations
- Frontend UI implementation

## 6. Member 3 — Geospatial / Satellite

### Branch
`feature/geospatial`

### Primary files
- `backend/app/providers/satellite/base.py`
- `backend/app/providers/satellite/mock.py`
- `backend/app/analysis/change_detection.py`
- `backend/app/analysis/vegetation.py`
- `backend/app/analysis/water.py`

### Goal
Create a provider-independent remote-sensing analysis layer.

### Required direction
The analysis layer should be able to consume imagery/data from a satellite provider abstraction and return structured results.

Design for future integration with sources such as Google Earth Engine, Sentinel, or Bhuvan, but do not make external credentials mandatory for the prototype.

### Result expectations
Where applicable, return structured information such as:
- metric
- before/after period
- change value
- trend
- units
- region/geometry metadata
- optional map/GeoJSON information

### Acceptance criteria
- Mock satellite provider remains usable.
- Analysis code is separated from provider-specific download logic.
- Vegetation analysis has a clear place for NDVI-based processing.
- Water analysis has a clear place for water-area/change processing.
- Change detection has a clear place for before/after comparison.
- Results are deterministic and JSON-serializable in mock mode.

### Do not own
- Natural-language intent extraction
- AI-generated explanations
- Frontend rendering

## 7. Member 4 — AI / VLM

### Branch
`feature/ai-vlm`

### Primary files
- `backend/app/providers/ai/base.py`
- `backend/app/providers/ai/mock.py`
- AI-related service code only when required to connect the provider

### Goal
Create an AI layer that can explain structured satellite-analysis results in natural language.

### Design rule
The AI layer should explain or summarize numerical/geospatial results produced by the analysis layer. It must not invent measurements.

### Prototype behavior
- Mock provider must remain available.
- Real AI/VLM integration should be optional and configuration-driven.
- Credentials must come from environment variables, never source code.

### Acceptance criteria
- Provider interface is stable.
- Mock explanation works without external services.
- AI input contains enough structured context to explain the result.
- Confidence values are clearly distinguished from AI prose.
- Failure of an external AI provider has a safe fallback.

### Do not own
- Satellite data acquisition
- Core GIS calculations
- Frontend styling

## 8. Member 5 — Frontend

### Branch
`feature/frontend`

### Primary files
- `frontend/index.html`
- `frontend/script.js`
- `frontend/style.css`

### Goal
Turn the prototype into a clear demo interface for submitting a satellite query and viewing results.

### Required user flow
1. User enters a natural-language satellite question.
2. UI sends the question to `POST /api/query`.
3. UI shows loading state.
4. UI displays intent, region, period, analysis result, confidence and explanation.
5. If imagery/map data is available, display it without breaking the basic result flow.
6. API errors should be shown clearly to the user.

### Acceptance criteria
- Existing UI remains functional.
- No backend URLs or secrets are hard-coded in multiple places.
- Loading and error states are visible.
- Results are readable on a laptop-sized screen.
- Frontend does not implement remote-sensing calculations itself.

### Do not own
- FastAPI internals
- Query parsing algorithms
- Satellite provider code

## 9. Member 6 — Testing / Integration / DevOps

### Branch
`feature/testing-integration`

### Primary ownership
- tests and integration support
- `README_ARCHITECTURE.md`
- `docs/architecture.md`
- `.env.example`
- project-level integration configuration when required

### Goal
Make the six parallel contributions safe to combine.

### Required checks
- Backend starts.
- `GET /api/health` works.
- `POST /api/query` works with at least one vegetation query and one water/change query.
- Imagery endpoint responds.
- Mock mode works without credentials.
- Frontend can reach the backend using the documented setup.
- Invalid input produces a controlled response.

### Acceptance criteria
- Add automated tests where practical.
- Document how to run the backend and frontend.
- Record required environment variables without exposing secrets.
- Identify integration failures before merge.
- Keep documentation synchronized with the actual architecture.

## 10. Integration Order

Use this order when combining work:

1. M2 — API contracts
2. M1 — query understanding/orchestration
3. M3 — geospatial analysis
4. M4 — AI/VLM explanation
5. M5 — frontend integration
6. M6 — full integration/testing

The order is about dependency flow, not priority.

## 11. Definition of Done

A feature is ready for merge when:
- it works from a clean checkout;
- it does not require hidden/local-only files;
- it preserves the mock/demo path;
- its public interfaces are documented;
- relevant tests or manual verification are completed;
- the PR describes the change and test result.

## 12. Prototype Principle

Build the prototype around replaceable providers:

`Frontend → FastAPI → Query Orchestrator → Analysis/Providers → Structured Result → AI Explanation → Frontend`

Real satellite and AI services can be plugged in later without redesigning the entire application.
