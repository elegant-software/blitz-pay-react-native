# Data Model: Voice Recording for AI Assistant

**Feature**: 009-voice-assistant-recording  
**Date**: 2026-04-26

## Entities

### MicState (UI state machine)

Represents the current phase of the microphone/recording lifecycle in the assistant screen. This is UI-only state — it is never persisted.

| Value | Description |
|-------|-------------|
| `idle` | Mic is muted; no recording or request in flight |
| `recording` | Mic is unmuted; audio capture is active |
| `processing` | Recording has stopped; waiting for server response |
| `error` | Server returned an error or recording failed |

**Transitions**:

```
idle ──(tap unmute)──► recording
recording ──(tap mute / max duration reached / screen blur)──► processing
processing ──(success)──► idle
processing ──(failure)──► error
error ──(tap unmute / retry)──► idle
```

**Validation rules**:
- The `recording → processing` transition only fires if at least one audio chunk was captured (duration > 0).
- `processing` is a non-interactive state: the mic toggle is disabled.
- `error` resets to `idle` when the user taps the mic again.

---

### VoiceRecording (transient, in-memory)

Represents a captured audio session while it is in-flight. Discarded after submission or on navigation away.

| Field | Type | Description |
|-------|------|-------------|
| `uri` | `string` | Local file URI of the recorded audio (mobile) or Blob URL (web) |
| `durationMs` | `number` | Duration of the captured audio in milliseconds |
| `mimeType` | `string` | MIME type of the audio (e.g., `audio/m4a`, `audio/webm`) |
| `capturedAt` | `Date` | Timestamp when recording started |

**Constraints**:
- `durationMs` must be > 0 before submission.
- `uri` must be accessible at upload time (file not yet cleaned up).

---

### TranscriptionResult (transient, in-memory)

The server's response to a submitted `VoiceRecording`. Held in screen state and displayed to the user.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transcript` | `string` | Yes | The recognised speech text |
| `language` | `string` | No | Detected language code (e.g., `"en"`, `"de"`) |

**Constraints**:
- `transcript` may be an empty string if no speech was detected; the UI displays a placeholder message in this case ("Nothing detected — please try again").
- This object is never written to storage.

---

## State Relationships

```
AssistantScreen
  └── micState: MicState
  └── activeRecording: VoiceRecording | null   (only non-null while micState = 'recording')
  └── transcriptResult: TranscriptionResult | null   (populated on successful response)
  └── errorMessage: string | null   (populated on failure)
```
