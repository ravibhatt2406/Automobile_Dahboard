import { Module } from '@nestjs/common';
import { ServiceQcService } from './service-qc.service';
import { ServiceQcController } from './service-qc.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ServiceQcController],
  providers: [ServiceQcService],
  exports: [ServiceQcService],
})
export class ServiceQcModule {}
