export interface BasketItem {
  productId: string;
  productName: string;
  branchId: string;
  merchantId: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  description?: string;
  imageUrl?: string;
}

export interface BasketState {
  merchantId?: string;
  merchantName?: string;
  branchId?: string;
  branchName?: string;
  currency: string;
  items: BasketItem[];
  lastValidatedAt?: string;
}

export interface BasketCheckoutItemSummary {
  productId: string;
  merchantId: string;
  branchId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
}

export interface CheckoutContext {
  merchantId: string;
  merchantName: string;
  branchId: string;
  branchName?: string;
  amount: number;
  currency: string;
  itemCount: number;
  itemSummary: string;
  basketItems: BasketCheckoutItemSummary[];
}
