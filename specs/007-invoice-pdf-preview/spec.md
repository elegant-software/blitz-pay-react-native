# Feature Specification: Invoice PDF Generation and Preview

**Feature Branch**: `007-invoice-pdf-preview`  
**Created**: 2026-04-19  
**Status**: Draft  
**Input**: User description: "using /Users/mehdi/MyProject/blitz-pay/api-docs/api-doc.yml in send invoice screen I need you first of all generate invoice and show pdf file, I think we can use reactnative pdf viewer component but do your own research I do not want to use webview"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate and View Invoice PDF (Priority: P1)

A user on the Send Invoice screen fills in invoice details (seller, buyer, line items, bank account) and taps "Generate Invoice". The app submits the data to the backend, receives a ZUGFeRD-compliant PDF, and immediately displays it inline within the app — no browser or external app opens.

**Why this priority**: This is the core feature. Without it, the user has no way to produce or review a professional invoice in-app.

**Independent Test**: Can be fully tested by filling in a minimal invoice form, tapping generate, and verifying a PDF renders on screen with readable content.

**Acceptance Scenarios**:

1. **Given** the user is on the Send Invoice screen with all required fields filled, **When** they tap "Generate Invoice", **Then** the app shows a loading indicator, calls the backend, and renders the returned PDF document on screen within 5 seconds.
2. **Given** the PDF is displayed, **When** the user scrolls through it, **Then** all pages are viewable with correct content (invoice number, line items, totals, bank details).
3. **Given** the backend returns an error, **When** the user taps "Generate Invoice", **Then** a user-friendly error message is shown and no blank screen appears.

---

### User Story 2 - Share or Save the Generated PDF (Priority: P2)

After viewing the generated PDF, the user can share it via the native share sheet (email, messaging, files app) or save it directly to their device.

**Why this priority**: A generated invoice has no business value if it cannot leave the app. Sharing/saving is the natural next step after reviewing.

**Independent Test**: Can be tested by generating a PDF and verifying the share button triggers the native share sheet with the PDF attached.

**Acceptance Scenarios**:

1. **Given** a PDF is displayed, **When** the user taps "Share", **Then** the native share sheet opens with the PDF ready to send or save.
2. **Given** the user selects "Save to Files", **Then** the PDF is saved to their device storage and a confirmation is shown.

---

### User Story 3 - Invoice Form Validation Before Generation (Priority: P3)

Before the PDF is generated, the app validates that all required fields are filled correctly and surfaces clear inline errors for any missing or invalid input.

**Why this priority**: Prevents unnecessary backend calls and helps users correct mistakes before submitting.

**Independent Test**: Can be tested by leaving required fields empty and verifying inline error messages appear without any network request being made.

**Acceptance Scenarios**:

1. **Given** the user taps "Generate Invoice" with missing required fields (e.g., buyer name, invoice number), **Then** each missing field is highlighted with a descriptive error message.
2. **Given** all required fields are valid, **When** the user taps "Generate Invoice", **Then** no validation errors appear and the generation proceeds.

---

### Edge Cases

- What happens when the PDF response is empty or malformed?
- How does the app handle a very large PDF (many line items, multi-page)?
- What if the user navigates away while the PDF is loading?
- What happens when there is no internet connection during generation?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Send Invoice screen MUST include input fields for all required invoice fields: invoice number, issue date, due date, seller details (name, street, zip, city, country), buyer details (name, street, zip, city, country), at least one line item (description, quantity, unit price, VAT %), and currency.
- **FR-002**: The system MUST validate all required fields before submitting to the backend and display field-level error messages for any invalid or missing values.
- **FR-003**: The app MUST submit completed invoice data to the backend invoice generation endpoint with `Accept: application/pdf` and handle both success and error responses.
- **FR-004**: The app MUST display the returned PDF document inline within the app using a native PDF rendering component — a WebView MUST NOT be used.
- **FR-005**: The PDF viewer MUST support multi-page scrolling and be legible at standard mobile screen sizes on both iOS and Android.
- **FR-006**: The user MUST be able to share or save the generated PDF via the native share sheet directly from the PDF view.
- **FR-007**: The app MUST show a loading indicator while the PDF is being generated and disable the generate button to prevent duplicate submissions.
- **FR-008**: The app MUST show a descriptive, user-friendly error message if PDF generation fails, distinguishing network errors from server-side errors.
- **FR-009**: Optional fields (bank account details, footer text) MUST be supported in the form but NOT required to generate the invoice.

### Key Entities

- **Invoice**: The complete invoice document — has a unique invoice number, issue/due dates, seller, buyer, line items, currency, and optional bank/footer fields. Backed by the `InvoiceData` schema.
- **TradeParty** (Seller / Buyer): A business entity identified by name and full address (street, zip, city, country), with an optional VAT ID.
- **LineItem**: A single billable entry with description, quantity, unit price, and VAT percentage. At least one is required per invoice.
- **BankAccount**: Optional payment destination with bank name, IBAN, and BIC.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the invoice form and view the generated PDF within 5 seconds on a standard mobile connection.
- **SC-002**: 100% of required field validation errors are surfaced before any network request is made.
- **SC-003**: The PDF renders correctly for invoices with 1 to 50 line items without layout errors or blank pages.
- **SC-004**: Users can share the generated PDF in 2 taps or fewer after it is displayed.
- **SC-005**: The app shows a meaningful error message in 100% of failure scenarios (network down, server error) — blank screens never appear.

## Assumptions

- The backend invoice endpoint (`POST /v1/invoices`) is available and returns a valid PDF/A-3 binary when given well-formed invoice data.
- Seller details may be pre-filled from the authenticated user's profile where available, reducing manual entry.
- The invoice currency defaults to EUR but can be changed by the user.
- Bank account details are optional; the PDF can be generated without them.
- Logo upload (`logoBase64`) is out of scope for this feature iteration and will not be exposed in the UI.
- The generated PDF is not persisted server-side — the app is responsible for saving/sharing if the user wants to keep it.
- EU ZUGFeRD compliance (PDF/A-3 with embedded XML) is handled entirely by the backend; the mobile app only renders and shares the binary response.
