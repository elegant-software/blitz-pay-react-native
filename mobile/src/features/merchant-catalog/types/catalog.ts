export type PaymentChannel = 'PAYPAL' | 'STRIPE' | 'TRUELAYER';

export interface MerchantBranch {
  branchId: string;
  merchantId: string;
  name: string;
  active: boolean;
  addressSummary?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  activePaymentChannels: PaymentChannel[];
  imageUrl?: string;
}

export interface ActiveProduct {
  productId: string;
  branchId: string;
  name: string;
  description?: string;
  unitPrice: number;
  imageUrl?: string;
  active: boolean;
  updatedAt?: string;
}

export interface CatalogValidationIssue {
  productId: string;
  type: 'missing' | 'inactive' | 'price_changed';
  latestUnitPrice?: number;
}
