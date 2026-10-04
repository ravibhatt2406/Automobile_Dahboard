import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { BranchesModule } from '../branches/branches.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [BranchesModule, ApprovalsModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
