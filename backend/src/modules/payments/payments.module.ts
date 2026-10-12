import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AuditModule } from '../audit/audit.module';
import { DevelopmentPaymentProvider } from './providers/development-payment.provider';

@Module({
  imports: [AuditModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, DevelopmentPaymentProvider],
  exports: [PaymentsService, DevelopmentPaymentProvider],
})
export class PaymentsModule {}
