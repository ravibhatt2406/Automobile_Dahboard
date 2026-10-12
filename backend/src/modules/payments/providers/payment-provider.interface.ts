export interface PaymentVerificationResult {
  verified: boolean;
  gatewayPaymentId: string;
  amount?: number;
  currency?: string;
  method?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export interface IPaymentProvider {
  readonly providerName: string;
  readonly isDevelopmentOnly: boolean;

  createOrder(params: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<{ gatewayOrderId: string; metadata?: any }>;

  verifySignature(params: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    signature: string;
    expectedAmount?: number;
  }): Promise<PaymentVerificationResult>;
}
