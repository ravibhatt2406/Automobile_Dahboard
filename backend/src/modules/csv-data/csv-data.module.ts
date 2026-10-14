import { Module } from '@nestjs/common';
import { CsvDataController } from './csv-data.controller';
import { CsvDataService } from './csv-data.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [CsvDataController],
  providers: [CsvDataService],
  exports: [CsvDataService],
})
export class CsvDataModule {}
