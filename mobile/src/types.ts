import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Merchant: { merchantId?: string; merchantName?: string };
  Checkout: { amount?: number; merchantName?: string; invoiceId?: string };
  MyQRCode: undefined;
  QRScanner: undefined;
  Invoices: undefined;
  SendInvoice: undefined;
  Notifications: undefined;
  PaymentProcessing: {
    paymentRequestId: string;
    amount?: number;
    currency?: string;
    merchantName?: string;
    invoiceId?: string;
  };
  PaymentResult: {
    paymentRequestId: string;
    status: 'succeeded' | 'failed' | 'cancelled';
    amount?: number;
    currency?: string;
    merchantName?: string;
    reason?: string;
  };
  PaymentPending: {
    paymentRequestId: string;
    amount?: number;
    currency?: string;
    merchantName?: string;
  };
  InvoicePdfPreview: {
    localUri: string;
    invoiceNumber: string;
  };
};

export type TabParamList = {
  Explore: undefined;
  Assistant: undefined;
  Vault: undefined;
  Account: undefined;
};

export type RootStackNav = NativeStackNavigationProp<RootStackParamList>;
export type TabNav = BottomTabNavigationProp<TabParamList>;
