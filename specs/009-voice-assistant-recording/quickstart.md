# Quickstart: Voice Recording for AI Assistant

**Feature**: 009-voice-assistant-recording  
**Date**: 2026-04-26

## Prerequisites

- Expo SDK 55 project already running (`cd mobile && npm run ios` or `npm run android`)
- A running BlitzPay backend reachable at `EXPO_PUBLIC_API_URL` (staging or local)
- For local backend testing: `kubectl port-forward svc/blitz-pay-backend 8080:8080 -n blitzpay-staging`

---

## Step 1 — Install `expo-audio`

```bash
cd mobile
npx expo install expo-audio
```

`expo-audio` is the Expo SDK 55 audio recording library. Verify it appears in `mobile/package.json` dependencies after install.

---

## Step 2 — Add iOS Microphone Permission

Edit `mobile/app.config.js`, inside the `ios.infoPlist` object:

```js
NSMicrophoneUsageDescription: "BlitzPay uses your microphone to send voice queries to the AI assistant.",
```

Android `RECORD_AUDIO` is already declared — no change needed.

After editing `app.config.js`, rebuild the native app:

```bash
# iOS
npm run ios

# Android
npm run android
```

> **Note**: Permissions declared in `infoPlist` require a full native rebuild. Running `expo start` alone is not sufficient.

---

## Step 3 — Create the Voice API Client

Create `mobile/src/lib/api/voiceApi.ts` following the contract in `contracts/voice-api.md`. The key responsibilities:

1. Accept a local audio file URI and its MIME type
2. Read the file as a Blob via `fetch(uri)`
3. Build a `FormData` with an `audio` field
4. Call `authedFetch('/v1/voice/query', { method: 'POST', body: formData })`
5. Return `{ transcript, language }` on success; throw on non-OK response

---

## Step 4 — Wire `AssistantScreen.tsx`

Replace the mock `muted`/`listening` toggle logic with the full state machine:

| Current | Replace with |
|---------|-------------|
| `const [muted, setMuted] = useState(false)` | `micState: MicState` ('idle' \| 'recording' \| 'processing' \| 'error') |
| `const [listening, setListening] = useState(false)` | Derived from `micState === 'recording'` |
| `toggleListening()` — no-op | Start recording via `expo-audio` `useAudioRecorder` |
| Tap mic icon in header | Same: toggles mute; if unmuting → start recording; if muting → stop + submit |

Key behaviours to implement:
- On `unmute`: call `Audio.requestPermissionsAsync()` → if granted start recorder
- On `mute`: stop recorder → set state to `processing` → call `submitVoiceQuery` → set transcript
- On screen blur (`useFocusEffect` cleanup): stop recorder and discard audio
- 60-second `setTimeout` auto-stops and submits

---

## Step 5 — Display Transcript

The existing `responseText` in the response card currently shows `t('ai_assistant_msg')`. Replace this with:

```tsx
<Text style={styles.responseText}>
  {transcriptResult?.transcript || t('ai_assistant_msg')}
</Text>
```

Show a loading indicator (e.g., `ActivityIndicator`) in place of the response card while `micState === 'processing'`.

---

## Step 6 — Smoke Test

1. Build and run on a simulator or physical device
2. Open the Assistant tab
3. Tap the mic icon to unmute — confirm the icon changes to recording state
4. Speak a sentence (or play audio near the mic)
5. Tap the mic icon to mute — confirm loading indicator appears
6. Confirm the transcript text appears in the response card within ~5 s
7. Test error path: turn off network → attempt a recording → confirm error message and mic resets

---

## Verifying the Voice Endpoint Directly

If you need to test the backend independently:

```bash
# Port-forward the backend
kubectl port-forward svc/blitz-pay-backend 8080:8080 -n blitzpay-staging

# Submit a test audio file
curl -X POST http://localhost:8080/v1/voice/query \
  -H "Authorization: Bearer <your-jwt>" \
  -F "audio=@/path/to/test.wav;type=audio/wav"
```

Expected response:
```json
{ "transcript": "...", "language": "en" }
```

See `k8s/whisper/README.md` for Whisper service setup details.

---

## Web Prototype (Secondary)

The web `src/screens/Assistant.tsx` uses the browser MediaRecorder API — no new npm dependency required. Wire the same state machine using `navigator.mediaDevices.getUserMedia({ audio: true })` and submit chunks as a `Blob` via the standard `fetch` call to `/v1/voice/query` with the JWT from `useAuth().token`.
