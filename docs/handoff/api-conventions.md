# API Conventions

## Base path

All resources: `/api/v1/{resource}`

IDs are UUIDs in path and body.

---

## Authentication header

```http
Authorization: Bearer <supabase_access_token>
```

Dev mock (see [test-users.md](./test-users.md)):

```http
X-Mock-Role: PLAYER
X-Mock-User-ID: <uuid>
X-Mock-Email: user@example.com
```

---

## List responses

Paginated lists return:

```json
{
  "items": [ ... ],
  "total": 42
}
```

### Query parameters

| Param | Default | Description |
|-------|---------|-------------|
| `page` | 1 | Page number (1-based) |
| `page_size` | 20 | Items per page (max 100) |
| `sort_by` | — | Field name |
| `sort_order` | `asc` | `asc` or `desc` |
| `search` | — | Full-text search on resource-specific fields |
| `filter` | — | Repeatable: `filter=field=value` |

Example:

```
GET /api/v1/transfers/?page=1&page_size=10&filter=status=PENDING&sort_by=submitted_at&sort_order=desc
```

---

## Error responses

All application errors use a consistent shape:

```json
{
  "detail": "Human-readable message",
  "error": {
    "code": "forbidden",
    "request_id": "uuid"
  }
}
```

### Common error codes

| HTTP | `error.code` | When |
|------|--------------|------|
| 400 | `validation_error` | Business rule failed |
| 401 | `unauthorized` | Missing or invalid token |
| 403 | `forbidden` | Authenticated but not allowed |
| 404 | `resource_not_found` | Entity not found |
| 409 | `duplicate_resource` | Unique constraint (e.g. duplicate FIDE ID) |
| 422 | `request_validation_error` | Invalid request body/query (Pydantic) |
| 429 | `rate_limit_exceeded` | External lookup rate limit |
| 502 | `external_service_error` | Lichess / Chess.com unreachable |
| 500 | `internal_error` | Unexpected server error |

Validation errors (422) return `detail` as an array of field errors:

```json
{
  "detail": [
    {
      "location": ["body", "player_id"],
      "message": "Field required",
      "type": "missing"
    }
  ],
  "error": { "code": "request_validation_error", "request_id": "..." }
}
```

Use `error.request_id` when reporting bugs to the backend team.

---

## Timestamps

All datetime fields are ISO 8601 with timezone (UTC), e.g. `"2026-01-15T10:00:00+00:00"`.

---

## File uploads

Use `multipart/form-data`, not JSON.

```javascript
const formData = new FormData();
formData.append("transfer_id", transferId);
formData.append("document_type", "release_letter");
formData.append("file", file);

await api.post("/documents/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

---

## Enums (status values)

Confirm exact values in Swagger (`/docs`) or `backend/app/models/enums.py`.

| Domain | Values |
|--------|--------|
| Registration status | `PENDING`, `APPROVED`, `REJECTED` |
| Transfer status | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| User role | `FEDERATION_ADMIN`, `LEAGUE_COORDINATOR`, `CLUB_ADMIN`, `PLAYER` |

---

## Request ID

Responses may include:

```http
X-Request-ID: <uuid>
```

Clients can send `X-Request-ID` on requests for tracing; the server generates one if omitted.

---

## OpenAPI / Swagger

Generate TypeScript types from the OpenAPI schema if desired:

```
GET http://localhost:8000/openapi.json
```

Tools: `openapi-typescript`, Orval, etc.
