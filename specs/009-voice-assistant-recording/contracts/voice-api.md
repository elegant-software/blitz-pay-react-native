# Contract: Voice Query API

**Feature**: 009-voice-assistant-recording  
**Date**: 2026-04-26  
**Source**: `/Users/mehdi/MyProject/blitz-pay/api-docs/api-doc.yml` — tag `Voice`

---

## Endpoint

```
POST /{version}/voice/query
```

Current version prefix in use across the project: `v1` → `POST /v1/voice/query`

---

## Request

**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | binary | Yes | Raw audio file (m4a, wav, webm, mp3 all accepted by Whisper backend) |

**Headers**:

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Recommended | `Bearer <access_token>` — passed automatically by `authedFetch` |

> The API spec marks `Authorization` as `required: false`, but the server uses it to associate the transcript with a user identity. Always include it from authenticated sessions.

**Example (curl)**:
```bash
curl -X POST https://<api-host>/v1/voice/query \
  -H "Authorization: Bearer <your-jwt>" \
  -F "audio=@recording.m4a;type=audio/mp4"
```

---

## Response

**HTTP 200 OK**  
**Content-Type**: `application/json`

```json
{
  "transcript": "Pay the invoice from Müller GmbH",
  "language": "de"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transcript` | string | Yes | Recognised speech text; may be empty string if no speech detected |
| `language` | string | No | ISO 639-1 language code detected by Whisper |

---

## Error Responses

The API spec does not enumerate error codes for this endpoint. Treat any non-200 HTTP status as a failure and display a generic user-friendly error. Relevant status codes to handle:

| Status | Handling |
|--------|---------|
| `400` | Bad request (e.g., missing `audio` field) — show error, reset mic to idle |
| `401` | Token expired — `authedFetch` auto-retries with refreshed token; if still 401, show auth error |
| `500` / `503` | Server error — show "Service temporarily unavailable" message, reset mic |
| Network error | Show "Could not reach the server" message, reset mic |

---

## Mobile Client (`mobile/src/lib/api/voiceApi.ts`)

```typescript
// Conceptual contract — not prescriptive of implementation syntax
interface VoiceTranscriptionResponse {
  transcript: string;
  language?: string;
}

// Accepts a local file URI and its MIME type.
// Returns the server transcript or throws on HTTP error.
async function submitVoiceQuery(
  audioUri: string,
  mimeType: string,
): Promise<VoiceTranscriptionResponse>
```

Implementation notes:
1. Fetch the file as a `Blob` from `audioUri` (React Native `fetch(uri)` → `response.blob()`).
2. Append the blob to a `FormData` under key `"audio"`.
3. Call `authedFetch('/v1/voice/query', { method: 'POST', body: formData })`.
4. Do NOT set `Content-Type` header manually — the runtime injects the multipart boundary.
5. Parse the JSON response body and return it as `VoiceTranscriptionResponse`.
6. Throw a descriptive `Error` on non-OK HTTP status.
