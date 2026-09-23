# SatQuery AI Architecture

## Flow
Frontend → FastAPI → Query Orchestrator → Providers/Analysis → Result

## Provider abstraction
Satellite and AI providers use interfaces so real services can replace the mock implementations without changing API or frontend code.

## Prototype
The current backend intentionally uses deterministic mock data. This makes the SIH demo reliable while leaving clear extension points for Google Earth Engine, Bhuvan, Sentinel data, Gemini, or a VLM.
