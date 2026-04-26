import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { BasketCheckoutItemSummary } from './features/basket/types/basket';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Merchant: {
    merchantId?: string;
    merchantName?: string;
    distanceMeters?: number;
  };
  Checkout: {
    amount?: number;
    merchantName?: string;
    merchantId?: string;
    branchId?: string;
    branchName?: string;
    basketSummary?: string;
    basketItemCount?: number;
    basketItems?: BasketCheckoutItemSummary[];
    invoiceId?: string;
  };
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
    basketSummary?: string;
  };
  InvoicePdfPreview: {
    localUri: string;
    invoiceNumber: string;
  };
  ProductDetail: {
    productId: string;
    name: string;
    description?: string;
    unitPrice: number;
    imageUrl?: string;
    merchantId: string;
    merchantName: string;
    branchId: string;
    branchName: string;
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
