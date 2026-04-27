# Implementation Plan: Voice Recording for AI Assistant

**Branch**: `009-voice-assistant-recording` | **Date**: 2026-04-26 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/009-voice-assistant-recording/spec.md`

## Summary

When the user unmutes the microphone in the AI Assistant screen, the app begins recording audio. When they mute again the recording stops, the audio file is sent as multipart/form-data to `POST /v1/voice/query` with the user's bearer token, and the returned transcript text is displayed in the assistant conversation area. This iteration is mobile-first (React Native / Expo SDK 55); the web prototype receives the same flow via the browser MediaRecorder API.

## Technical Context

**Language/Version**: TypeScript 5.3, React Native 0.83.6  
**Primary Dependencies**: Expo SDK 55, `expo-audio` (new audio package for SDK 55+), `authedFetch` (existing authenticated HTTP utility)  
**Storage**: No persistence required — transcript is in-memory/UI state only  
**Testing**: No test suite configured (noted in CLAUDE.md)  
**Target Platform**: iOS 15.1+, Android (minSdk derived from Expo 55 defaults)  
**Project Type**: Mobile app (React Native / Expo) + web SPA (React + Vite)  
**Performance Goals**: Transcript displayed within 3 s of submission for recordings ≤ 30 s  
**Constraints**: Mic permission must be requested before first recording; recording stops on screen blur; 60 s max duration; audio in m4a/wav  
**Scale/Scope**: Single-screen feature; no backend changes required

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution file is a placeholder template — no project-specific principles have been ratified. Evaluation is based on CLAUDE.md conventions and existing codebase patterns:

| Gate | Status | Notes |
|------|--------|-------|
| No new screens — modifies existing `AssistantScreen` | PASS | No new screen type needed |
| Uses existing `authedFetch` pattern for API call | PASS | Consistent with all other API calls |
| Uses `expo-audio` (SDK 55 standard) rather than deprecated `expo-av` | PASS | Aligns with SDK version |
| iOS `NSMicrophoneUsageDescription` not in `app.config.js` | FLAG | Must be added before audio permission can be requested on iOS |
| Android `RECORD_AUDIO` already declared | PASS | Already in `app.config.js` permissions array |
| Web uses browser MediaRecorder API — no new dependency | PASS | Standard Web API, no library needed |

**No constitution violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/009-voice-assistant-recording/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── voice-api.md     # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
mobile/
├── app.config.js                          # Add NSMicrophoneUsageDescription
├── src/
│   ├── lib/
│   │   └── api/
│   │       └── voiceApi.ts                # NEW: voice query API client
│   └── screens/
│       └── AssistantScreen.tsx            # MODIFY: wire recording + transcript

src/
└── screens/
    └── Assistant.tsx                      # MODIFY: wire MediaRecorder + transcript
```

**Structure Decision**: Existing single-project structure. New API client follows the `mobile/src/lib/api/` pattern (alongside `authedFetch.ts`, `merchantCommerce.ts`). Screen modifications are in-place — no new screen files needed.

## Complexity Tracking

No constitution violations — this table is not needed.
