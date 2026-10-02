import { Module } from '@nestjs/common';
import { ServiceDiagnosisService } from './service-diagnosis.service';
import { ServiceDiagnosisController } from './service-diagnosis.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ServiceDiagnosisController],
  providers: [ServiceDiagnosisService],
  exports: [ServiceDiagnosisService],
})
export class ServiceDiagnosisModule {}
