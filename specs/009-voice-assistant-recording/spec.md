# Feature Specification: Voice Recording for AI Assistant

**Feature Branch**: `009-voice-assistant-recording`  
**Created**: 2026-04-26  
**Status**: Draft  
**Input**: User description: "there is ai assistant icon in the application whenever user unmutes the mic app should record a voice and send it to the back-end, server will return you a text for now u need to read it"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record and Transcribe Voice Input (Priority: P1)

A user opens the AI Assistant screen and taps the microphone icon to unmute it. The app begins recording their voice. When they tap the icon again to mute, the recording stops and is sent to the voice transcription service. The returned transcript text is displayed in the assistant conversation area.

**Why this priority**: This is the core feature — without it there is no voice interaction at all. Everything else depends on a successful recording and transcription cycle.

**Independent Test**: Can be tested fully by opening the assistant screen, tapping the mic to unmute, speaking a phrase, tapping again to mute, and verifying the spoken text appears on screen.

**Acceptance Scenarios**:

1. **Given** the user is on the AI Assistant screen, **When** they tap the microphone icon (currently muted), **Then** the icon changes to an active/recording state and audio capture begins.
2. **Given** recording is in progress, **When** the user taps the microphone icon again, **Then** recording stops, a loading indicator appears, and the captured audio is submitted to the voice transcription endpoint.
3. **Given** the transcription request succeeds, **When** the server returns a transcript, **Then** the transcribed text is displayed in the assistant UI and the loading indicator is dismissed.

---

### User Story 2 - Visual Feedback During Recording and Processing (Priority: P2)

While recording is active the user sees a clear visual cue (e.g., pulsing animation or colour change on the mic icon) so they know the app is capturing their voice. While waiting for the transcription response a loading state is shown to prevent the user from triggering a second recording.

**Why this priority**: Without feedback, users do not know if the app heard them and may repeat themselves or assume the feature is broken.

**Independent Test**: Can be verified independently by observing the mic icon and surrounding UI during each phase (idle → recording → processing → result) without needing to validate the transcript content.

**Acceptance Scenarios**:

1. **Given** the mic is unmuted, **When** recording is active, **Then** a visual recording indicator is visible and distinct from the idle state.
2. **Given** recording has stopped and the request is in-flight, **When** the user views the assistant screen, **Then** a loading/processing indicator is shown and the mic button is disabled.
3. **Given** the response is received (success or error), **When** the UI updates, **Then** the loading indicator is dismissed and the mic button becomes interactive again.

---

### User Story 3 - Graceful Handling of Errors (Priority: P3)

If the voice transcription service is unavailable or the recording could not be sent, the user receives a clear, non-technical error message and can retry without restarting the app.

**Why this priority**: Reliability matters for trust. The happy path (P1) delivers the core value; this story ensures the feature degrades gracefully rather than silently.

**Independent Test**: Can be tested by simulating an unreachable server or empty audio clip and verifying that the UI shows an error state with a retry affordance.

**Acceptance Scenarios**:

1. **Given** the user submits a recording, **When** the service is unreachable or returns an error, **Then** a user-friendly error message is shown (no technical details) and the mic is reset to idle state.
2. **Given** an error state is displayed, **When** the user taps to retry or unmutes again, **Then** a new recording session can begin normally.

---

### Edge Cases

- What happens if the user taps the mic but has not granted microphone permission? The app must surface a clear permission prompt and not attempt to record without it.
- What happens if the recording produces silence or near-silence? The server may return an empty transcript; the UI should handle an empty string without crashing.
- What happens if the user navigates away mid-recording? The recording must stop and the incomplete audio must be discarded rather than silently submitted.
- What happens if recording runs very long (beyond the maximum duration cap)? Recording stops automatically and the captured audio up to that point is submitted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The AI Assistant screen MUST have a microphone toggle control that switches between muted (idle) and unmuted (recording) states.
- **FR-002**: When the microphone is unmuted, the app MUST begin capturing the user's voice immediately.
- **FR-003**: When the microphone is muted after an active recording session, the app MUST transmit the captured audio to the voice transcription endpoint with the authenticated user's identity included in the request.
- **FR-004**: The voice transcription endpoint receives a single audio file (multipart/form-data, field name `audio`) and returns a response containing a `transcript` text field and an optional `language` field.
- **FR-005**: The app MUST display the returned `transcript` text in the AI Assistant conversation area upon a successful response.
- **FR-006**: The microphone control MUST be disabled and a processing indicator MUST be shown while a transcription request is in-flight.
- **FR-007**: The app MUST request microphone permission before the first recording attempt; if permission is denied, an informative message MUST be shown and no recording attempt MUST be made.
- **FR-008**: If the user navigates away from the AI Assistant screen during an active recording, the recording MUST stop and the captured audio MUST be discarded.
- **FR-009**: If the transcription request fails for any reason, the app MUST display a user-friendly error message and reset the microphone control to idle state.
- **FR-010**: A maximum recording duration cap MUST be enforced; when reached, recording stops automatically and the captured audio to that point is submitted for transcription.

### Key Entities

- **Voice Recording**: A time-bounded audio capture session initiated by a user; key attributes are audio data, duration, and capture timestamp.
- **Transcription Result**: The server's response to a submitted recording; contains `transcript` (the recognised text) and optionally `language` (detected language code).
- **Microphone State**: A UI-level state with four values: `idle`, `recording`, `processing`, `error`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete a full record-and-read cycle (unmute → speak → mute → see transcript) in under 15 seconds under normal network conditions.
- **SC-002**: The transcript returned by the server is displayed on screen within 3 seconds of the recording being submitted, for recordings up to 30 seconds in length.
- **SC-003**: The microphone control is visually distinct in all three active states (recording, processing, idle) such that users can identify the current state without instruction.
- **SC-004**: Error states are self-recoverable — the user can attempt a new recording without restarting the app after any single failure.
- **SC-005**: The feature operates correctly on both iOS and Android platforms.

## Assumptions

- The voice transcription endpoint is `POST /v1/voice/query` (multipart/form-data, `audio` field); the server handles speech-to-text internally and the client does not interact with the transcription engine directly.
- The authenticated user's bearer token is available from the existing auth context and must be included in the `Authorization` header of the voice request.
- Audio is recorded in a format accepted by the server (WAV or equivalent; standard audio content types are supported).
- For this iteration, the transcript is displayed only — no further AI processing, intent parsing, or command execution is in scope.
- A maximum recording duration of 60 seconds is a reasonable default cap; this can be revisited once real-world usage data is available.
- Microphone permission handling follows standard platform prompts; no custom permission rationale screen is required for this iteration.
- The feature targets the mobile app (React Native / Expo) first; the web prototype's assistant screen is a later concern.
