# SatQuery AI — API Contracts

## 1. Contract Purpose

This document defines the HTTP contracts shared by the frontend, backend, query layer, geospatial layer and AI layer.

The current prototype already exposes the endpoints below. Changes to response field names should be treated as integration changes and coordinated before merging.

## 2. Base URL

Local backend:

`http://127.0.0.1:8000`

API prefix:

`/api`

The frontend should use a configurable API base URL where practical.

## 3. Health

### Request

`GET /api/health`

### Current response

```json
{
  "status": "healthy",
  "service": "satquery-api"
}
```

### Contract
- HTTP 200 when the API process is healthy.
- No authentication is required for the prototype.

## 4. Natural-Language Query

### Request

`POST /api/query`

Content-Type:

`application/json`

Body:

```json
{
  "query": "Show vegetation change in Andhra Pradesh between 2023 and 2025"
}
```

### Request contract

| Field | Type | Required | Description |
|---|---|---:|---|
| `query` | string | Yes | Natural-language satellite/earth-observation question |

### Current response shape

```json
{
  "query": "Show vegetation change in Andhra Pradesh between 2023 and 2025",
  "intent": "vegetation_change",
  "region": "Andhra Pradesh",
  "analysis": {
    "metric": "NDVI change",
    "change_percentage": 12.4,
    "trend": "decrease",
    "period": "2023 → 2025"
  },
  "confidence": 0.87,
  "explanation": "Demo analysis indicates a 12.4% vegetation-index change in Andhra Pradesh between 2023 and 2025.",
  "provider": "mock",
  "next_step": "Replace mock providers with real satellite/AI providers."
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `query` | string | Original user query |
| `intent` | string | Selected analysis intent |
| `region` | string | Parsed region or safe fallback |
| `analysis` | object | Structured analysis output |
| `confidence` | number | Confidence value associated with the current analysis result |
| `explanation` | string | Human-readable explanation |
| `provider` | string | Current provider mode, e.g. `mock` |
| `next_step` | string | Prototype/future-provider information |

### Supported intent values in the current parser

- `vegetation_change`
- `water_analysis`
- `urban_analysis`
- `change_detection`
- `general_satellite_query`

New intent values must be documented before frontend logic depends on them.

## 5. Imagery Search

### Request

`GET /api/imagery/search`

Query parameters:

| Parameter | Type | Default | Description |
|---|---|---:|---|
| `region` | string | `Andhra Pradesh` | Region to search |
| `start_year` | integer | 2023 | Beginning year |
| `end_year` | integer | 2025 | Ending year |

Example:

`/api/imagery/search?region=Andhra%20Pradesh&start_year=2023&end_year=2025`

### Current implementation note

The current endpoint calls the mock satellite provider. The exact provider response should be preserved or explicitly versioned when real imagery providers are introduced.

## 6. Query Plan — Internal Contract

The current query parser returns a dictionary conceptually equivalent to:

```json
{
  "intent": "vegetation_change",
  "region": "Andhra Pradesh",
  "start_year": 2023,
  "end_year": 2025,
  "query": "original user query"
}
```

This is an internal service contract between query understanding and analysis/orchestration. It is not currently a public HTTP endpoint.

## 7. Analysis — Internal Contract

The current analysis service returns:

```json
{
  "analysis": {
    "metric": "NDVI change",
    "change_percentage": 12.4,
    "trend": "decrease",
    "period": "2023 → 2025"
  },
  "explanation": "Human-readable explanation",
  "confidence": 0.87
}
```

Future geospatial implementations may add fields, but existing consumers should not break.

## 8. Error Handling

Expected API errors should be JSON responses with an appropriate HTTP status code.

At minimum:
- 400 for invalid request data where applicable.
- 404 for unknown routes.
- 500 for unexpected server errors.

Do not expose stack traces, API keys or provider credentials to the frontend.

## 9. Provider Boundary

### Satellite

The satellite provider should expose a stable abstraction so mock and real providers can be swapped.

Conceptually:

`search_imagery(region, start_year, end_year)`

Additional methods may be introduced for:
- image retrieval
- metadata
- region/geometry handling
- time-series data

### AI

The AI provider should receive structured analysis context and return an explanation or interpretation.

It must not replace authoritative numerical analysis with invented values.

## 10. Frontend Integration Rule

The frontend consumes the public API only.

Do not import Python/backend code into the frontend or duplicate backend analysis logic in JavaScript.

## 11. Compatibility Rule

When changing a public response:
1. document the change here;
2. update the backend schema if applicable;
3. update frontend parsing;
4. update tests;
5. mention the contract change in the PR.

Avoid renaming fields casually during parallel development.
