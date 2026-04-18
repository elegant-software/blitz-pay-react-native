# Quickstart: Invoice PDF Generation and Preview

**Feature**: 007-invoice-pdf-preview

---

## New Dependencies

Install before implementing:

```bash
cd mobile
npm install react-native-pdf react-native-blob-util expo-sharing
npx expo prebuild --clean   # regenerates native projects
```

### iOS — no extra steps
`react-native-pdf` uses PDFKit (built into iOS 11+). No extra pods needed.

### Android — no extra steps
`react-native-pdf` uses `PdfRenderer` (built into Android API 21+). No extra configuration.

---

## New Files

```
mobile/src/
├── services/
│   └── invoiceService.ts          # API call: POST /v1/invoices → temp file URI
├── screens/
│   └── InvoicePdfPreviewScreen.tsx  # Full-screen PDF viewer + share button
└── types/
    └── invoice.ts                 # InvoiceFormState, TradeParty, LineItem, BankAccount types
```

**Modified files**:
```
mobile/src/screens/SendInvoiceScreen.tsx   # Add invoice-details + preview steps; wire API call
mobile/src/navigation/AppNavigator.tsx     # Register InvoicePdfPreview stack screen
mobile/src/types.ts                        # Add InvoicePdfPreview to RootStackParamList
mobile/src/lib/translations.ts             # Add invoice form / error translation keys
```

---

## Key Implementation Notes

### Fetching the PDF binary

```ts
// invoiceService.ts — sketch only, not final code
import RNBlobUtil from 'react-native-blob-util';

const path = `${RNBlobUtil.fs.dirs.CacheDir}/invoice-${invoiceNumber}.pdf`;
await RNBlobUtil.config({ fileCache: true, path }).fetch('POST', url, headers, JSON.stringify(body));
// Returns: { path() } — pass to react-native-pdf as source={{ uri: `file://${path}` }}
```

### Displaying the PDF

```tsx
import Pdf from 'react-native-pdf';
<Pdf source={{ uri: fileUri }} style={{ flex: 1 }} />
```

### Sharing

```ts
import * as Sharing from 'expo-sharing';
await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
```

---

## Testing the Feature

1. Start the backend: `http://localhost:8080`
2. Run the app: `cd mobile && npm run ios`
3. Navigate to Send Invoice → fill all required fields → tap "Generate PDF"
4. Verify the PDF renders with correct invoice content
5. Tap Share and verify the native share sheet opens with the PDF attached
6. Test error cases: kill the backend, attempt generation, verify error message appears

---

## Environment

No new environment variables required. Uses `EXPO_PUBLIC_API_URL` (already set).
