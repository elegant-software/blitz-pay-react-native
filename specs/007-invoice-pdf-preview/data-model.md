# Data Model: Invoice PDF Generation and Preview

**Feature**: 007-invoice-pdf-preview  
**Date**: 2026-04-19

---

## Entities

### InvoiceFormState (UI state — not persisted)

Represents the in-progress invoice being edited in `SendInvoiceScreen`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `invoiceNumber` | string | Yes | Auto-suggested (e.g. `INV-2026-001`), user-editable |
| `issueDate` | string (YYYY-MM-DD) | Yes | Defaults to today |
| `dueDate` | string (YYYY-MM-DD) | Yes | Defaults to +30 days |
| `currency` | string | Yes | Defaults to `EUR` |
| `seller` | TradeParty | Yes | Pre-filled from user profile where available |
| `buyer` | TradeParty | Yes | Selected from recipients step |
| `lineItems` | LineItem[] | Yes | Min 1 item |
| `bankAccount` | BankAccount \| null | No | Optional |
| `footerText` | string \| null | No | Optional |

---

### TradeParty

Represents either the seller or buyer on an invoice.

| Field | Type | Required |
|---|---|---|
| `name` | string | Yes |
| `street` | string | Yes |
| `zip` | string | Yes |
| `city` | string | Yes |
| `country` | string | Yes |
| `vatId` | string \| null | No |

---

### LineItem

A single billable line on the invoice.

| Field | Type | Required | Validation |
|---|---|---|---|
| `description` | string | Yes | Non-empty |
| `quantity` | number | Yes | > 0 |
| `unitPrice` | number | Yes | > 0 |
| `vatPercent` | number | Yes | 0–100 |

**Derived**: `lineTotal = quantity × unitPrice`, `vatAmount = lineTotal × (vatPercent / 100)`

---

### BankAccount (optional)

| Field | Type | Required |
|---|---|---|
| `bankName` | string | Yes (if section present) |
| `iban` | string | Yes (if section present) |
| `bic` | string | Yes (if section present) |

---

### GeneratedPdf (runtime only — not persisted)

| Field | Type | Notes |
|---|---|---|
| `localUri` | string | Temp file URI on device (cache dir) |
| `filename` | string | e.g. `invoice-INV-2026-001.pdf` |

---

## Validation Rules

- `invoiceNumber`: required, non-empty string
- `issueDate` / `dueDate`: valid ISO dates; `dueDate` must be ≥ `issueDate`
- At least one `lineItem` with non-empty `description`, `quantity > 0`, `unitPrice > 0`, `vatPercent` in [0, 100]
- `seller.name`, `seller.street`, `seller.zip`, `seller.city`, `seller.country`: all required
- `buyer.name`, `buyer.street`, `buyer.zip`, `buyer.city`, `buyer.country`: all required
- `bankAccount`: if any bank field is filled, all three (bankName, iban, bic) must be present

---

## State Transitions (SendInvoiceScreen steps)

```
recipients → invoice-details → items → preview
                                        ↓
                                  [PDF displayed]
                                        ↓
                                  Share / Done
```
