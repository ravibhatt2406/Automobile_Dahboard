import { Module } from '@nestjs/common';
import { ServiceJobsService } from './service-jobs.service';
import { ServiceJobsController } from './service-jobs.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ServiceJobsController],
  providers: [ServiceJobsService],
  exports: [ServiceJobsService],
})
export class ServiceJobsModule {}
