export interface TradeParty {
  name: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  vatId?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  vatPercent: string;
}

export interface BankAccount {
  bankName: string;
  iban: string;
  bic: string;
}

export interface InvoiceFormState {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  seller: TradeParty;
  buyer: TradeParty;
  lineItems: LineItem[];
  bankAccount: BankAccount;
  footerText: string;
}

export interface GeneratedPdf {
  localUri: string;
  filename: string;
}
