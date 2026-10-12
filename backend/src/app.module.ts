import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { validateEnv } from './config/env.config';

// Core & Common
import { DatabaseModule } from './database/database.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantScopeGuard } from './common/guards/tenant-scope.guard';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { FranchisesModule } from './modules/franchises/franchises.module';
import { BranchesModule } from './modules/branches/branches.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './health/health.module';

// Phase 2 Core Business Operations Modules
import { CustomersModule } from './modules/customers/customers.module';
import { CrmModule } from './modules/crm/crm.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FinanceModule } from './modules/finance/finance.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { InvoicesModule } from './modules/billing/invoices.module';
import { PdiModule } from './modules/pdi/pdi.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { FilesModule } from './modules/files/files.module';

// Phase 3 After-Sales & Operations Modules
import { ServiceAppointmentsModule } from './modules/service-appointments/service-appointments.module';
import { ServiceJobsModule } from './modules/service-jobs/service-jobs.module';
import { ServiceDiagnosisModule } from './modules/service-diagnosis/service-diagnosis.module';
import { ServiceLabourModule } from './modules/service-labour/service-labour.module';
import { PartsModule } from './modules/parts/parts.module';
import { ServiceQcModule } from './modules/service-qc/service-qc.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    AuditModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    FranchisesModule,
    BranchesModule,
    EmployeesModule,
    ApprovalsModule,
    HealthModule,
    // Phase 2
    CustomersModule,
    CrmModule,
    CatalogueModule,
    InventoryModule,
    QuotationsModule,
    BookingsModule,
    PaymentsModule,
    FinanceModule,
    InsuranceModule,
    InvoicesModule,
    PdiModule,
    DeliveriesModule,
    FilesModule,
    // Phase 3
    ServiceAppointmentsModule,
    ServiceJobsModule,
    ServiceDiagnosisModule,
    ServiceLabourModule,
    PartsModule,
    ServiceQcModule,
    NotificationsModule,
    ReportsModule,
    DashboardsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantScopeGuard,
    },
  ],
})
export class AppModule {}
