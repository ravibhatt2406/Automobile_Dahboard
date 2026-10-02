import { Module } from '@nestjs/common';
import { ServiceAppointmentsService } from './service-appointments.service';
import { ServiceAppointmentsController } from './service-appointments.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ServiceAppointmentsController],
  providers: [ServiceAppointmentsService],
  exports: [ServiceAppointmentsService],
})
export class ServiceAppointmentsModule {}
