# Research: Voice Recording for AI Assistant

**Feature**: 009-voice-assistant-recording  
**Date**: 2026-04-26

## 1. Audio Recording Library (Mobile)

**Decision**: `expo-audio` (`expo-audio` package from Expo SDK 55)  
**Rationale**: Expo SDK 55 introduced `expo-audio` as the official replacement for the audio recording portions of `expo-av`. The project is already on Expo SDK 55 (`^55.0.17` in `package.json`). Using `expo-audio` avoids pulling in the heavier `expo-av` bundle and aligns with the SDK's recommended path.  
**Alternatives considered**:
- `expo-av` — functional but in maintenance mode for SDK 55+; adds unnecessary bundle weight since only `Audio.Recording` is needed
- `react-native-audio-recorder-player` — third-party, requires native build integration, unnecessary when Expo provides a first-party solution

**Key API**: `useAudioRecorder` hook from `expo-audio`; records to `m4a` on iOS and `3gp`/`m4a` on Android. Both are accepted by the server's Whisper backend as it supports all common audio formats.

## 2. Audio Format Compatibility

**Decision**: Use `expo-audio` default output format (m4a on iOS, m4a on Android with `AudioQuality.High`)  
**Rationale**: The Whisper model used by the backend (confirmed in `k8s/whisper/README.md`) accepts `audio/wav`, `audio/mpeg`, `audio/mp4` (m4a), and other common formats. The `curl` test example uses WAV for convenience only; m4a works identically.  
**Alternatives considered**:
- Force WAV output — possible via encoder options but increases file size significantly with no benefit for this use case
- PCM raw audio — not practical for over-the-wire submission

## 3. Authenticated API Call Pattern

**Decision**: Use existing `authedFetch` utility (`mobile/src/lib/api/authedFetch.ts`)  
**Rationale**: `authedFetch` already handles Bearer token injection, 401 → refresh → retry, and URL joining against `config.apiUrl`. Submitting a `FormData` body with the `audio` file is fully supported by the standard `fetch` API used inside `authedFetch`.  
**Usage**:
```
authedFetch('/v1/voice/query', {
  method: 'POST',
  body: formData,   // FormData with 'audio' Blob field
})
```
`authedFetch` must NOT set `Content-Type` manually when body is `FormData` — the browser/RN runtime sets it with the correct `multipart/form-data` boundary automatically.

## 4. iOS Microphone Permission

**Decision**: Add `NSMicrophoneUsageDescription` to `app.config.js` `ios.infoPlist`  
**Rationale**: iOS requires this Info.plist key before any app can request microphone access. It is absent from the current `app.config.js`; without it the app will crash on the permission request on iOS.  
**Required change**:
```js
infoPlist: {
  // ... existing entries ...
  NSMicrophoneUsageDescription: "BlitzPay uses your microphone to send voice queries to the AI assistant.",
}
```
**Android**: `RECORD_AUDIO` is already declared in `app.config.js` `android.permissions`.

## 5. Permission Request Timing (Mobile)

**Decision**: Request microphone permission on first tap of the mic toggle (lazy, on-demand)  
**Rationale**: Matches the established pattern for camera (`expo-camera`) and location (`expo-location`) in this project — permissions are requested at the point of use, not on app launch. `expo-audio` exposes `Audio.requestPermissionsAsync()` for this.  
**Flow**:
1. User taps mic icon → check permission status
2. If `undetermined` → call `requestPermissionsAsync()` → show system dialog
3. If `denied` → show in-app alert explaining why mic is needed
4. If `granted` → begin recording

## 6. Recording Lifecycle & Screen Navigation

**Decision**: Stop and discard recording on screen blur using React Navigation's `useIsFocused` or a `useFocusEffect` cleanup  
**Rationale**: If the user navigates away mid-recording, the audio capture must stop to prevent a dangling recorder instance and avoid submitting an incomplete/unexpected recording. This is the standard approach in the existing navigation setup (React Navigation v6).

## 7. Maximum Recording Duration

**Decision**: 60-second cap enforced via a `setTimeout` that calls `stopRecording()` when reached  
**Rationale**: Whisper's default max input is ~30 minutes but network upload time grows with recording length. 60 s is a practical upper bound for a conversational assistant query. On automatic stop, the captured audio is submitted normally (same code path as manual mute).

## 8. Web (React) Audio Recording

**Decision**: `navigator.mediaDevices.getUserMedia` + `MediaRecorder` API (built-in browser API)  
**Rationale**: No additional dependency needed for the web prototype. `MediaRecorder` records to `webm/ogg` (Chrome) or `mp4` (Safari) — both accepted by Whisper. The web assistant (`src/screens/Assistant.tsx`) currently uses a simple `isMuted` boolean toggle and can be wired with the same state machine pattern.  
**Blob submission**:
```ts
const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
const formData = new FormData();
formData.append('audio', blob, 'recording.webm');
```

## 9. Transcript Display Area

**Decision**: Replace the static `t('ai_assistant_msg')` text in the response card with reactive state  
**Rationale**: The existing `responseCard` / `responseText` section in `AssistantScreen.tsx` (and the equivalent `motion.div` in `Assistant.tsx`) is the natural home for the transcript. The feature spec says "display the transcript" — no new UI component is needed, just wiring state to the existing element.

## 10. Error Display

**Decision**: Use an in-screen alert/toast pattern consistent with existing screens  
**Rationale**: The codebase uses `Alert.alert()` (React Native) for brief error notifications (seen in payment and auth flows). The web uses a simple inline error state. Both are sufficient for this feature's error requirement.
