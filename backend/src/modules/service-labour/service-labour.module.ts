import { Module } from '@nestjs/common';
import { ServiceLabourService } from './service-labour.service';
import { ServiceLabourController } from './service-labour.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ServiceLabourController],
  providers: [ServiceLabourService],
  exports: [ServiceLabourService],
})
export class ServiceLabourModule {}
