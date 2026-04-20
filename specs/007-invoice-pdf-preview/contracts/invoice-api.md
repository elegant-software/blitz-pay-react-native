# Contract: Invoice Generation API

**Endpoint**: `POST /v1/invoices`  
**Source**: `/Users/mehdi/MyProject/blitz-pay/api-docs/api-doc.yml`

---

## Request

**Headers**:
```
Content-Type: application/json
Accept: application/pdf
Authorization: Bearer <token>
```

**Body** (`InvoiceData`):
```json
{
  "invoiceNumber": "INV-2026-001",
  "issueDate": "2026-04-19",
  "dueDate": "2026-05-19",
  "currency": "EUR",
  "seller": {
    "name": "Acme GmbH",
    "street": "Musterstraße 1",
    "zip": "10115",
    "city": "Berlin",
    "country": "DE",
    "vatId": "DE123456789"
  },
  "buyer": {
    "name": "Kunde AG",
    "street": "Käuferweg 5",
    "zip": "80331",
    "city": "München",
    "country": "DE"
  },
  "lineItems": [
    {
      "description": "Consulting Services",
      "quantity": 8,
      "unitPrice": 150.00,
      "vatPercent": 19
    }
  ],
  "bankAccount": {
    "bankName": "Deutsche Bank",
    "iban": "DE89370400440532013000",
    "bic": "COBADEFFXXX"
  },
  "footerText": "Zahlbar innerhalb von 30 Tagen."
}
```

**Required fields**: `invoiceNumber`, `issueDate`, `dueDate`, `currency`, `seller`, `buyer`, `lineItems` (min 1 item)  
**Optional fields**: `bankAccount`, `footerText`, `logoBase64` (not exposed in UI for this feature)

---

## Response

**Success** `200 OK`:
```
Content-Type: application/pdf
Body: <binary PDF/A-3 data>
```

The PDF is a PDF/A-3 file with embedded ZUGFeRD XML (EU e-invoice standard).

**Error responses**: Standard HTTP error codes; body is a text description.

---

## Mobile Client Behaviour

1. Send request with `Accept: application/pdf`
2. On `200`: write binary body to `{cacheDir}/invoice-{invoiceNumber}.pdf` via `react-native-blob-util`
3. Pass local file URI to `react-native-pdf` for display
4. On non-200: parse status code and show user-facing error (see FR-008 in spec)
5. Network failure: catch and show `error_server_unreachable` translation key
