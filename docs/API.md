# API

Base URL: `/api/v1`

- `GET /health` → `{ "status": "ok" }`
- `POST /cases` with `{ "storySeed": string, "difficulty": "easy"|"medium"|"hard", "theme": allowedTheme }` → `201 { case }`
- `GET /cases/:caseId` → `200 { case }` (public fields only)
- `POST /cases/:caseId/accusation` with `{ "suspectId": string }` → `200 { result }`

Errors use `{ "error": { "code", "message", "requestId" } }`. Accusations are deterministic and reveal solution fields only in the result response.
