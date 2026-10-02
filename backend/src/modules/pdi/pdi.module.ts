import { Module } from '@nestjs/common';
import { PdiService } from './pdi.service';
import { PdiController } from './pdi.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PdiController],
  providers: [PdiService],
  exports: [PdiService],
})
export class PdiModule {}
