# Tasks: Voice Recording for AI Assistant

**Input**: Design documents from `/specs/009-voice-assistant-recording/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the new audio library and add the missing iOS permission — required before any code can reference `expo-audio` or request mic access.

- [x] T001 Install `expo-audio` package by running `npx expo install expo-audio` in `mobile/`
- [x] T002 Add `NSMicrophoneUsageDescription: "BlitzPay uses your microphone to send voice queries to the AI assistant."` to the `ios.infoPlist` block in `mobile/app.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core building blocks that all user stories depend on — the API client and the shared state type must exist before any screen wiring can begin.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Create `mobile/src/lib/api/voiceApi.ts` with exported `VoiceTranscriptionResponse` interface (`transcript: string; language?: string`) and `submitVoiceQuery(audioUri: string, mimeType: string): Promise<VoiceTranscriptionResponse>` function that reads the file as a Blob via `fetch(audioUri)`, builds a `FormData` with an `audio` field, calls `authedFetch('/v1/voice/query', { method: 'POST', body: formData })`, parses and returns the JSON body, and throws a descriptive `Error` on non-OK HTTP status
- [x] T004 [P] Replace the existing `muted` and `listening` booleans with a single `micState` state variable typed as `'idle' | 'recording' | 'processing' | 'error'` and a `transcriptResult` state of type `VoiceTranscriptionResponse | null` at the top of `mobile/src/screens/AssistantScreen.tsx`; update all derived UI expressions to read from `micState` instead

**Checkpoint**: Foundation ready — `voiceApi.ts` callable, `micState` machine in place.

---

## Phase 3: User Story 1 — Record and Transcribe Voice Input (Priority: P1) 🎯 MVP

**Goal**: Full record-and-read cycle — user unmutes, speaks, mutes, sees transcript displayed in the response card.

**Independent Test**: Open the Assistant tab, unmute the mic, speak a sentence, mute again; the spoken words appear in the response card within ~5 s. No other stories need to be complete to verify this.

- [x] T005 [US1] Import `useAudioRecorder` and `AudioModule` from `expo-audio`, call `AudioModule.requestRecordingPermissionsAsync()` inside the mic-toggle handler before starting any recording, and handle the `denied` case by keeping `micState` at `'idle'` in `mobile/src/screens/AssistantScreen.tsx`
- [x] T006 [US1] On mic toggle when `micState === 'idle'` and permission granted, call `recorder.prepareToRecordAsync(RecordingOptionsPresets.HIGH_QUALITY)` then `recorder.record()` and set `micState` to `'recording'` in `mobile/src/screens/AssistantScreen.tsx`
- [x] T007 [US1] On mic toggle when `micState === 'recording'`, call `recorder.stop()`, retrieve the resulting URI, set `micState` to `'processing'`, invoke `submitVoiceQuery(uri, mimeType)` from `voiceApi.ts`, store the result in `transcriptResult`, and set `micState` back to `'idle'` in `mobile/src/screens/AssistantScreen.tsx`
- [x] T008 [US1] Replace the static `t('ai_assistant_msg')` text in the `responseCard` / `responseText` element with `transcriptResult?.transcript ?? t('ai_assistant_msg')` in `mobile/src/screens/AssistantScreen.tsx`
- [x] T009 [US1] Add a `useEffect` that starts a `setTimeout` (60 000 ms) when `micState` becomes `'recording'` and calls the same stop-and-submit logic as T007 on expiry; clear the timeout when `micState` changes away from `'recording'` in `mobile/src/screens/AssistantScreen.tsx`
- [x] T010 [US1] Add a `useFocusEffect` cleanup that calls `recorder.stop()` and discards the audio URI (without submitting) if `micState === 'recording'` when the screen loses focus in `mobile/src/screens/AssistantScreen.tsx`

**Checkpoint**: User Story 1 fully functional and independently testable. MVP deliverable complete.

---

## Phase 4: User Story 2 — Visual Feedback During Recording and Processing (Priority: P2)

**Goal**: Each mic state (idle / recording / processing / error) shows a visually distinct treatment so users always know what the app is doing.

**Independent Test**: Navigate through the four mic states without needing a real backend — mock the processing delay; confirm idle icon, recording pulse, processing spinner, and error colour are all visually distinct.

- [x] T011 [P] [US2] Show the existing waveform `listeningIndicator` bars only when `micState === 'recording'` (replacing the old `listening && !muted` condition) and add a pulsing `Animated` opacity loop to the bars while recording is active in `mobile/src/screens/AssistantScreen.tsx`
- [x] T012 [P] [US2] Replace the static response card content with an `ActivityIndicator` (centered, matching `colors.primary`) while `micState === 'processing'`; restore the transcript/placeholder text when processing ends in `mobile/src/screens/AssistantScreen.tsx`
- [x] T013 [US2] Disable the mic toggle `TouchableOpacity` (`disabled={micState === 'processing'}`) and reduce its opacity to 0.5 while processing to signal non-interactivity in `mobile/src/screens/AssistantScreen.tsx`
- [x] T014 [US2] Update the avatar label text to reflect all four states: `'Tap to speak'` (idle), `'Listening…'` (recording), `'Processing…'` (processing), `'Error — tap to retry'` (error) in `mobile/src/screens/AssistantScreen.tsx`

**Checkpoint**: All four mic states visually distinct; loading spinner present during processing; mic button non-interactive while processing.

---

## Phase 5: User Story 3 — Graceful Handling of Errors (Priority: P3)

**Goal**: Any failure (permission denied, network error, server error, empty transcript) gives the user a clear message and a path to retry without restarting the app.

**Independent Test**: Disable Wi-Fi, attempt a recording, confirm a non-technical error message appears and the mic resets; then re-enable Wi-Fi and confirm a new recording succeeds.

- [x] T015 [US3] In the permission-denied branch (T005), call `Alert.alert('Microphone Required', 'Please enable microphone access in Settings to use the voice assistant.')` and keep `micState` at `'idle'` in `mobile/src/screens/AssistantScreen.tsx`
- [x] T016 [US3] Wrap the `submitVoiceQuery` call (T007) in a `try/catch`; on error set `micState` to `'error'` and call `Alert.alert('Could not reach the voice service', 'Please check your connection and try again.')` in `mobile/src/screens/AssistantScreen.tsx`
- [x] T017 [US3] When `submitVoiceQuery` succeeds but `transcript` is an empty string, set `transcriptResult` to `{ transcript: "Nothing was detected. Please try speaking again." }` instead of storing the empty response in `mobile/src/screens/AssistantScreen.tsx`
- [x] T018 [US3] Ensure tapping the mic toggle button when `micState === 'error'` resets state to `'idle'` before attempting a new recording cycle (i.e., the `'error'` state is cleared on the next tap) in `mobile/src/screens/AssistantScreen.tsx`

**Checkpoint**: All error paths display user-friendly messages; every failure is self-recoverable without restarting the app.

---

## Phase 6: Web Prototype — Voice Recording (Secondary, React SPA)

**Purpose**: Bring the same record-and-transcribe behaviour to the web `src/screens/Assistant.tsx` using the browser MediaRecorder API. No new npm dependencies required.

- [x] T019 [P] Add `mediaRecorderRef`, `chunksRef`, `micState` state (`'idle' | 'recording' | 'processing' | 'error'`), and `transcriptResult` state to `src/screens/Assistant.tsx`; replace the existing `isMuted` boolean with `micState` and update all derived rendering expressions
- [x] T020 On mic toggle when `micState === 'idle'`, call `navigator.mediaDevices.getUserMedia({ audio: true })`, create a `MediaRecorder`, accumulate `ondataavailable` chunks, and set `micState` to `'recording'` in `src/screens/Assistant.tsx`
- [x] T021 On mic toggle when `micState === 'recording'`, call `mediaRecorder.stop()`, assemble a `Blob` from collected chunks, build a `FormData` with an `audio` field, POST to `/v1/voice/query` with `Authorization: Bearer <token>` from `useAuth().token`, parse `{ transcript }` and store in `transcriptResult`, set `micState` to `'idle'` on success or `'error'` on failure in `src/screens/Assistant.tsx`
- [x] T022 Replace the static `t('ai_assistant_msg')` in the response bubble with `transcriptResult?.transcript ?? t('ai_assistant_msg')` and show a loading spinner in the bubble while `micState === 'processing'` in `src/screens/Assistant.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Translation keys, final smoke test, and minor cleanup across both surfaces.

- [x] T023 [P] Add any missing translation keys for new UI strings (`'listening'`, `'processing'`, `'error_retry'`, empty-transcript fallback message) to both `de` and `en` objects in `mobile/src/lib/translations.ts` and `src/lib/translations.ts`; replace hardcoded English strings in AssistantScreen/Assistant with `t(...)` calls
- [ ] T024 Run the full smoke test described in `specs/009-voice-assistant-recording/quickstart.md` steps 1–7 on a physical iOS and/or Android device to validate the end-to-end flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 must complete before `expo-audio` can be imported in T003/T004)
- **User Stories (Phase 3–5)**: All depend on Phase 2 completion; T003 and T004 can run in parallel within Phase 2
- **Web Phase (Phase 6)**: Independent of Phase 3–5; can start after Phase 2
- **Polish (Phase 7)**: Depends on Phases 3–6 being substantially complete

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2 (T003, T004); no dependency on US2 or US3
- **US2 (P2)**: Requires Phase 2 (T004); builds on existing `micState` established in Phase 2; US1 not required but coexists naturally
- **US3 (P3)**: Requires Phase 2 (T003, T004) and at minimum T005/T007 from US1 (the places where errors can actually occur)

### Within Each User Story

- T005 (permission) before T006 (start recording)
- T006 (start) before T007 (stop + submit)
- T007 before T008 (display transcript)
- T009 and T010 are independent of T008 and can run in parallel with it

---

## Parallel Execution Examples

### Phase 2

```
T003: Create mobile/src/lib/api/voiceApi.ts
T004: Refactor MicState in mobile/src/screens/AssistantScreen.tsx
↑ These touch different files — run in parallel
```

### Phase 4 (US2)

```
T011: Recording waveform animation in AssistantScreen.tsx
T012: Processing spinner in AssistantScreen.tsx
↑ Both modify the same file but in different JSX sections — sequential is safer
↑ If splitting work, T011 (avatar section) and T012 (response card) are in separate JSX blocks
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003, T004 in parallel)
3. Complete Phase 3: US1 (T005 → T006 → T007 → T008, plus T009 + T010)
4. **STOP and VALIDATE**: Smoke-test the full record-and-read cycle
5. Demo with working voice transcription

### Incremental Delivery

1. Phase 1 + 2 → Infrastructure ready
2. Phase 3 (US1) → Functional voice input MVP
3. Phase 4 (US2) → Polished visual feedback
4. Phase 5 (US3) → Production-grade error handling
5. Phase 6 → Web parity
6. Phase 7 → Final polish and QA

---

## Notes

- `expo-audio` uses `useAudioRecorder` hook (SDK 55 API); verify `RecordingOptionsPresets` export name in the installed version
- Do NOT set `Content-Type` header manually when passing `FormData` to `authedFetch` — the runtime injects the multipart boundary automatically
- Native rebuild required after editing `app.config.js` (T002); `expo start` alone is not sufficient
- The `audio` field name in `FormData` must match the API contract exactly (`"audio"` — lowercase)
- [P] tasks = different file sections or different files, no shared state dependency
- Each user story is independently completable and testable
- Commit after each phase checkpoint to keep git history clean
