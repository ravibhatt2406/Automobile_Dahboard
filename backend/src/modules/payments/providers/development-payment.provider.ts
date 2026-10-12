import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { IPaymentProvider, PaymentVerificationResult } from './payment-provider.interface';

@Injectable()
export class DevelopmentPaymentProvider implements IPaymentProvider {
  readonly providerName = 'DEVELOPMENT_SANDBOX_GATEWAY';
  readonly isDevelopmentOnly = true;

  private readonly logger = new Logger(DevelopmentPaymentProvider.name);
  private readonly secretKey = process.env.PAYMENT_GATEWAY_SECRET || 'dev-titan-auto-secure-payment-secret-key-2026';

  async createOrder(params: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<{ gatewayOrderId: string; metadata?: any }> {
    const gatewayOrderId = `DEV_ORD_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.logger.debug(
      `[DEV ONLY] Created sandbox payment order: ${gatewayOrderId} for Order ID: ${params.orderId}, Amount: ${params.amount} ${params.currency}`,
    );

    return {
      gatewayOrderId,
      metadata: {
        provider: this.providerName,
        isDevelopmentMode: true,
        modeWarning: 'DEVELOPMENT ONLY: Safe mock gateway provider abstraction.',
      },
    };
  }

  async verifySignature(params: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    signature: string;
    expectedAmount?: number;
  }): Promise<PaymentVerificationResult> {
    const { gatewayOrderId, gatewayPaymentId, signature } = params;

    if (!signature || typeof signature !== 'string' || signature.trim() === '') {
      return {
        verified: false,
        gatewayPaymentId,
        errorMessage: 'Missing payment signature from client verification payload.',
      };
    }

    // Cryptographic HMAC-SHA256 Signature calculation
    const expectedHmac = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest('hex');

    // Safe comparison: Check HMAC match or designated test token in non-production
    const isExactHmacMatch =
      signature.length === expectedHmac.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac));

    const isDesignatedDevToken =
      process.env.NODE_ENV !== 'production' &&
      (signature === 'valid_gateway_signature' || signature.startsWith('dev_sig_verified_'));

    if (isExactHmacMatch || isDesignatedDevToken) {
      this.logger.log(
        `[DEV ONLY] Payment signature verified server-side for Gateway Payment ID: ${gatewayPaymentId}`,
      );
      return {
        verified: true,
        gatewayPaymentId,
        method: 'DEVELOPMENT_SANDBOX',
        metadata: {
          verifiedBy: this.providerName,
          verificationTimestamp: new Date().toISOString(),
        },
      };
    }

    this.logger.warn(
      `Payment signature verification REJECTED for Gateway Payment ID: ${gatewayPaymentId}. Cryptographic mismatch.`,
    );

    return {
      verified: false,
      gatewayPaymentId,
      errorMessage: 'Cryptographic payment signature mismatch. Server-side verification failed.',
    };
  }
}
