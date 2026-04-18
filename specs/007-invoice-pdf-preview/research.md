# Research: Invoice PDF Generation and Preview

**Feature**: 007-invoice-pdf-preview  
**Date**: 2026-04-19

---

## Decision 1: Native PDF Viewer Library

**Decision**: `react-native-pdf` + `react-native-blob-util`

**Rationale**:
- `react-native-pdf` uses PDFKit (iOS) and PdfRenderer (Android) — both native, no WebView
- Handles multi-page PDFs with native scrolling
- Most adopted RN PDF library (~4k GitHub stars, actively maintained)
- `react-native-blob-util` is its documented companion for fetching binary data and writing temp files; avoids base64 round-trip overhead for large PDFs
- Works with Expo bare workflow (project uses `expo-dev-client`, so native modules are supported)

**Alternatives considered**:
| Library | Reason rejected |
|---|---|
| `rn-pdf-reader-js` | Uses WebView internally — explicitly excluded |
| `react-native-pdf-light` | Fewer features, less maintained, no Android PdfRenderer support |
| `@dr.pogodin/react-native-pdf` | Fork of react-native-pdf; original is sufficiently maintained |
| `expo-print` | Generates PDFs from HTML; cannot render server-provided PDF binary |
| Custom base64 + Image | Loses text selection, search, and multi-page handling |

---

## Decision 2: PDF File Fetch & Temp Storage

**Decision**: `react-native-blob-util` for fetching the binary PDF and writing to the app's cache directory

**Rationale**:
- `react-native-blob-util` provides `fetch()` that writes directly to a file path without loading the full binary into JS memory — critical for potentially large PDF/A-3 files
- The saved temp file URI is then passed directly to `react-native-pdf` as `source={{ uri }}`
- No need to add `expo-file-system` separately; `react-native-blob-util` covers both fetch and file I/O

---

## Decision 3: PDF Sharing

**Decision**: `expo-sharing` for sharing/saving the generated PDF

**Rationale**:
- `expo-sharing` is not yet installed but is the standard Expo mechanism for triggering the native share sheet with a file URI
- Works on both iOS (`UIActivityViewController`) and Android (Intent chooser)
- Simpler API than wiring `react-native-blob-util`'s share utilities
- Consistent with Expo ecosystem already used in the project

---

## Decision 4: Invoice Form Structure

**Decision**: Add a new "invoice details" step to the existing `SendInvoiceScreen` multi-step flow, rather than creating a separate screen

**Rationale**:
- The existing screen already has a step system (`recipients` → `items`)
- A third step `invoice-details` collecting seller/buyer/VAT/dates fits naturally
- A fourth step `preview` renders the PDF viewer
- This keeps navigation simple; no new route or stack screen needed for the form itself
- The PDF viewer is pushed as a new native stack screen (`InvoicePdfPreview`) to allow full-screen rendering and a clean back button

---

## Decision 5: API Integration

**Endpoint**: `POST /v1/invoices`  
**Request**: `InvoiceData` JSON body  
**Response**: Binary `application/pdf` (PDF/A-3 with embedded ZUGFeRD XML)

**Fetch strategy**: Use the auth token from `useAuth()` in the Authorization header. The binary response is written to a temp file via `react-native-blob-util`, not loaded into memory as base64.

---

## New Dependencies Required

| Package | Purpose |
|---|---|
| `react-native-pdf` | Native PDF rendering (PDFKit / PdfRenderer) |
| `react-native-blob-util` | Binary PDF fetch + temp file write |
| `expo-sharing` | Native share sheet for PDF |
