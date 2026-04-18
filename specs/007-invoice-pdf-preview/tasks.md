# Tasks: Invoice PDF Generation and Preview

**Input**: Design documents from `/specs/007-invoice-pdf-preview/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/invoice-api.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Dependencies & Native Build)

**Purpose**: Install new native packages and regenerate the native project

- [x] T001 Install `react-native-pdf`, `react-native-blob-util`, and `expo-sharing` in `mobile/package.json` by running `npm install react-native-pdf react-native-blob-util expo-sharing` from the `mobile/` directory
- [x] T00 Regenerate native projects by running `npx expo prebuild --clean` from `mobile/` (required after adding native modules)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, navigation registration, and translation keys that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T00 Create `mobile/src/types/invoice.ts` — define and export TypeScript types: `TradeParty`, `BankAccount`, `LineItem`, `InvoiceFormState`, `GeneratedPdf` matching the shapes in `specs/007-invoice-pdf-preview/data-model.md`
- [x] T00 [P] Add `InvoicePdfPreview: { localUri: string; invoiceNumber: string }` to `RootStackParamList` in `mobile/src/types.ts`
- [x] T00 [P] Add invoice-related translation keys to both `en` and `de` objects in `mobile/src/lib/translations.ts`: `invoice_number`, `issue_date`, `due_date`, `seller_details`, `buyer_details`, `vat_id`, `bank_details`, `iban`, `bic`, `bank_name`, `footer_text`, `generate_pdf`, `generating_pdf`, `share_invoice`, `invoice_preview`, `error_pdf_generation_failed`
- [x] T00 Register `InvoicePdfPreviewScreen` as a stack screen in `mobile/src/navigation/AppNavigator.tsx` — import the (not yet created) screen and add it to the `NativeStackNavigator` alongside existing screens

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Generate and View Invoice PDF (Priority: P1) 🎯 MVP

**Goal**: User fills invoice form, taps Generate, backend returns a PDF, app displays it natively inline

**Independent Test**: Fill all required fields in Send Invoice screen → tap "Generate PDF" → verify PDF renders with correct content on screen (no WebView, no external app)

### Implementation

- [x] T00 Create `mobile/src/services/invoiceService.ts` — implement `generateInvoicePdf(data: InvoiceFormState, token: string): Promise<GeneratedPdf>`:
  - Use `react-native-blob-util` to POST to `${config.apiUrl}/v1/invoices` with `Content-Type: application/json` and `Accept: application/pdf` headers
  - Write binary response to `{RNBlobUtil.fs.dirs.CacheDir}/invoice-{invoiceNumber}.pdf`
  - Return `{ localUri: 'file://{path}', filename: 'invoice-{invoiceNumber}.pdf' }`
  - Detect network errors and throw with key `error_server_unreachable`; throw `error_pdf_generation_failed` for non-200 responses

- [x] T00 Create `mobile/src/screens/InvoicePdfPreviewScreen.tsx` — full-screen PDF viewer:
  - Receive `localUri` and `invoiceNumber` from route params
  - Render `<Pdf source={{ uri: localUri }} style={{ flex: 1 }} />` from `react-native-pdf`
  - Show a header with back button and invoice number
  - Show `ActivityIndicator` while PDF is loading (`onLoadProgress`)
  - Show error message if PDF fails to load (`onError`)
  - Reserve space at bottom for Share button (implemented in US2)

- [x] T00 Extend `mobile/src/screens/SendInvoiceScreen.tsx` — add `invoice-details` as a new step between `recipients` and `items`:
  - Add step type: `'recipients' | 'invoice-details' | 'items' | 'preview'`
  - Add form fields for: `invoiceNumber` (pre-filled with `INV-{YYYY}-{NNN}`), `issueDate` (today), `dueDate` (+30 days), `currency` (EUR), seller section (name, street, zip, city, country, vatId optional), buyer section (name, street, zip, city, country), bank account section (bankName, iban, bic — all optional)
  - Update step indicator to show 3 steps (recipients → invoice-details → items)
  - Update back button navigation: `items` → `invoice-details` → `recipients`

- [x] T01 Wire "Generate PDF" CTA in `mobile/src/screens/SendInvoiceScreen.tsx`:
  - Replace the mock `handleSend` on the `items` step with a real call to `invoiceService.generateInvoicePdf(formState, token)`
  - Show `ActivityIndicator` and disable the button while generating (`generating` state)
  - On success: navigate to `InvoicePdfPreview` screen with `{ localUri, invoiceNumber }`
  - On error: show the translated error message using `setError(t(errorKey))`

- [x] T01 [P] Add error banner UI to `mobile/src/screens/SendInvoiceScreen.tsx` — show a styled error message below the step content when `error` state is non-null; auto-dismiss after 5 seconds or on user tap

**Checkpoint**: User Story 1 fully functional — form → generate → view PDF in-app ✓

---

## Phase 4: User Story 2 — Share / Save Generated PDF (Priority: P2)

**Goal**: User taps Share in the PDF preview screen and the native share sheet opens with the PDF attached

**Independent Test**: From the PDF preview screen, tap Share → verify native share sheet opens with the PDF file attached and correct filename

### Implementation

- [x] T01 [US2] Add Share button to `mobile/src/screens/InvoicePdfPreviewScreen.tsx`:
  - Import `expo-sharing` and call `Sharing.shareAsync(localUri, { mimeType: 'application/pdf', dialogTitle: invoiceNumber })`
  - Place a primary-styled Share button in the bottom area of the screen
  - Show `ActivityIndicator` on the button while share sheet is opening
  - Handle the case where sharing is unavailable on the platform (`Sharing.isAvailableAsync()`)

**Checkpoint**: User Stories 1 and 2 complete — generate, view, and share PDF ✓

---

## Phase 5: User Story 3 — Invoice Form Validation (Priority: P3)

**Goal**: Required fields are validated before submission; each invalid field shows an inline error; no network call is made until all required fields are valid

**Independent Test**: Leave required fields empty (e.g. buyer name, invoice number) → tap "Generate PDF" → verify inline field errors appear with no network request made

### Implementation

- [x] T01 [US3] Add validation logic to `mobile/src/screens/SendInvoiceScreen.tsx`:
  - Implement `validateInvoiceDetails(): Record<string, string>` that returns a map of `fieldName → errorKey` for any failing rule
  - Rules from `specs/007-invoice-pdf-preview/data-model.md`: invoiceNumber required; issueDate and dueDate valid ISO dates with dueDate ≥ issueDate; seller all five address fields required; buyer all five address fields required; at least one line item with non-empty description, quantity > 0, unitPrice > 0, vatPercent 0–100; if any bank field filled, all three required
  - Call `validateInvoiceDetails()` in the CTA handler before calling the API; abort and set errors if any rule fails

- [x] T01 [US3] Add inline field error display to `mobile/src/screens/SendInvoiceScreen.tsx`:
  - Maintain a `fieldErrors: Record<string, string>` state
  - After failed validation, set `fieldErrors` and scroll to the first error field
  - Render a red error label below each invalid `TextInput` showing the translated error message
  - Clear a field's error when the user starts editing that field (`onFocus` or `onChangeText`)

**Checkpoint**: All 3 user stories complete ✓

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T01 [P] Handle edge cases in `mobile/src/services/invoiceService.ts` and `InvoicePdfPreviewScreen.tsx`:
  - If `react-native-pdf` `onError` fires: show error message and a "Go Back" button instead of blank screen
  - If PDF binary is 0 bytes: throw `error_pdf_generation_failed` before saving
  - Cancel the blob-util fetch if the user navigates away mid-generation (use `useEffect` cleanup)

- [x] T01 [P] Clean up temp PDF files in `mobile/src/screens/InvoicePdfPreviewScreen.tsx`:
  - On component unmount (`useEffect` cleanup), delete `localUri` file using `react-native-blob-util` `fs.unlink()` to avoid accumulating temp files in the cache directory

- [x] T01 Validate end-to-end flow against `specs/007-invoice-pdf-preview/quickstart.md` test scenarios: start backend at `http://192.168.2.102:8080`, generate a PDF with a 3-line-item invoice, verify all pages render, share the PDF, kill the backend and verify the error message appears

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001, T002) — **blocks all user stories**
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on T008 (InvoicePdfPreviewScreen exists)
- **User Story 3 (Phase 5)**: Depends on T009 (invoice-details form step exists)
- **Polish (Phase 6)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — no story dependencies
- **US2 (P2)**: Requires T008 (InvoicePdfPreviewScreen) from US1 — add Share button to existing screen
- **US3 (P3)**: Requires T009 (invoice-details form) from US1 — add validation to existing form

### Within User Story 1

```
T007 (invoiceService) ──┐
                         ├──→ T010 (wire CTA) ──→ T011 (error banner)
T008 (PDF viewer) ───────┘
T009 (form step) ────────┘
```

T007, T008, T009 can all run in parallel. T010 depends on all three.

---

## Parallel Opportunities

```bash
# Phase 2 — run together:
T003  # types/invoice.ts
T004  # types.ts (RootStackParamList)
T005  # translations.ts
T006  # AppNavigator.tsx

# Phase 3 — run together first:
T007  # invoiceService.ts
T008  # InvoicePdfPreviewScreen.tsx (skeleton)
T009  # SendInvoiceScreen.tsx (invoice-details step)
# Then:
T010  # wire CTA (depends on T007, T008, T009)
T011  # error banner (parallel with T010)

# Phase 6 — run together:
T015  # edge cases
T016  # temp file cleanup
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Phase 1: Install packages + prebuild
2. Phase 2: Types, navigation, translations
3. Phase 3: invoiceService + InvoicePdfPreviewScreen + form step + wire CTA
4. **STOP and validate**: Generate a real PDF and verify it renders
5. Ship US1 as MVP

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Generate + view PDF ← **Demo-able MVP**
3. Phase 4 (US2) → Add share button ← Adds sharing
4. Phase 5 (US3) → Add validation ← Improves UX
5. Phase 6 → Polish + edge cases

---

## Notes

- [P] tasks touch different files and have no cross-task dependencies
- [US] label maps each task to its user story for traceability
- `react-native-pdf` requires a native rebuild — `expo prebuild --clean` in Phase 1 is mandatory
- Temp PDF files accumulate in cache if T016 is skipped — include in same PR as T008
- The existing `SendInvoiceScreen` mock `handleSend` is replaced in T010, not refactored alongside
