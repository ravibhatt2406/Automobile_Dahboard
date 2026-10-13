import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';

// Lazy-loaded route components for performance code-splitting
const LandingPage = lazy(() => import('@/features/landing/LandingPage').then((m) => ({ default: m.LandingPage })));
const AccountTypeSelectionPage = lazy(() =>
  import('@/features/auth/AccountTypeSelectionPage').then((m) => ({ default: m.AccountTypeSelectionPage }))
);
const CustomerLoginPage = lazy(() =>
  import('@/features/auth/CustomerLoginPage').then((m) => ({ default: m.CustomerLoginPage }))
);
const CustomerRegisterPage = lazy(() =>
  import('@/features/auth/CustomerRegisterPage').then((m) => ({ default: m.CustomerRegisterPage }))
);
const OrganizationLoginPage = lazy(() =>
  import('@/features/auth/OrganizationLoginPage').then((m) => ({ default: m.OrganizationLoginPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const DashboardRouter = lazy(() =>
  import('@/features/dashboard/DashboardRouter').then((m) => ({ default: m.DashboardRouter }))
);

// Individual Dashboard components
const CustomerDashboard = lazy(() =>
  import('@/features/dashboard/CustomerDashboard').then((m) => ({ default: m.CustomerDashboard }))
);
const MechanicDashboard = lazy(() =>
  import('@/features/dashboard/MechanicDashboard').then((m) => ({ default: m.MechanicDashboard }))
);
const SalesDashboard = lazy(() =>
  import('@/features/dashboard/SalesDashboard').then((m) => ({ default: m.SalesDashboard }))
);
const BranchManagerDashboard = lazy(() =>
  import('@/features/dashboard/BranchManagerDashboard').then((m) => ({ default: m.BranchManagerDashboard }))
);
const FranchiseOwnerDashboard = lazy(() =>
  import('@/features/dashboard/FranchiseOwnerDashboard').then((m) => ({ default: m.FranchiseOwnerDashboard }))
);
const SuperAdminDashboard = lazy(() =>
  import('@/features/dashboard/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard }))
);

// Organization Management
const FranchisesListPage = lazy(() =>
  import('@/features/franchises/FranchisesListPage').then((m) => ({ default: m.FranchisesListPage }))
);
const FranchiseDetailPage = lazy(() =>
  import('@/features/franchises/FranchiseDetailPage').then((m) => ({ default: m.FranchiseDetailPage }))
);
const BranchesListPage = lazy(() =>
  import('@/features/branches/BranchesListPage').then((m) => ({ default: m.BranchesListPage }))
);
const BranchDetailPage = lazy(() =>
  import('@/features/branches/BranchDetailPage').then((m) => ({ default: m.BranchDetailPage }))
);
const EmployeesListPage = lazy(() =>
  import('@/features/employees/EmployeesListPage').then((m) => ({ default: m.EmployeesListPage }))
);
const EmployeeDetailPage = lazy(() =>
  import('@/features/employees/EmployeeDetailPage').then((m) => ({ default: m.EmployeeDetailPage }))
);
const EmployeeApprovalsPage = lazy(() =>
  import('@/features/employees/EmployeeApprovalsPage').then((m) => ({ default: m.EmployeeApprovalsPage }))
);
const RolesPermissionsPage = lazy(() =>
  import('@/features/employees/RolesPermissionsPage').then((m) => ({ default: m.RolesPermissionsPage }))
);

// Customers & Customer 360
const CustomersListPage = lazy(() =>
  import('@/features/customers/CustomersListPage').then((m) => ({ default: m.CustomersListPage }))
);
const Customer360Page = lazy(() =>
  import('@/features/customers/Customer360Page').then((m) => ({ default: m.Customer360Page }))
);

// CRM & Visual Sales Pipeline
const LeadsListPage = lazy(() => import('@/features/crm/LeadsListPage').then((m) => ({ default: m.LeadsListPage })));
const LeadDetailPage = lazy(() => import('@/features/crm/LeadDetailPage').then((m) => ({ default: m.LeadDetailPage })));

// Inventory & Vehicle Studio
const BrowseTrucksPage = lazy(() =>
  import('@/features/inventory/BrowseTrucksPage').then((m) => ({ default: m.BrowseTrucksPage }))
);
const VehiclesListPage = lazy(() =>
  import('@/features/inventory/VehiclesListPage').then((m) => ({ default: m.VehiclesListPage }))
);
const VehicleStudioPage = lazy(() =>
  import('@/features/inventory/VehicleStudioPage').then((m) => ({ default: m.VehicleStudioPage }))
);
const VehicleDetailPage = lazy(() =>
  import('@/features/inventory/VehicleDetailPage').then((m) => ({ default: m.VehicleDetailPage }))
);

// Sales & Quotations & Bookings
const SalesOverviewPage = lazy(() =>
  import('@/features/sales/SalesOverviewPage').then((m) => ({ default: m.SalesOverviewPage }))
);
const QuotationsListPage = lazy(() =>
  import('@/features/quotations/QuotationsListPage').then((m) => ({ default: m.QuotationsListPage }))
);
const QuotationFormPage = lazy(() =>
  import('@/features/quotations/QuotationFormPage').then((m) => ({ default: m.QuotationFormPage }))
);
const QuotationDetailPage = lazy(() =>
  import('@/features/quotations/QuotationDetailPage').then((m) => ({ default: m.QuotationDetailPage }))
);
const BookingsListPage = lazy(() =>
  import('@/features/bookings/BookingsListPage').then((m) => ({ default: m.BookingsListPage }))
);
const BookingDetailPage = lazy(() =>
  import('@/features/bookings/BookingDetailPage').then((m) => ({ default: m.BookingDetailPage }))
);

// Billing & Invoices
const InvoicesListPage = lazy(() =>
  import('@/features/billing/InvoicesListPage').then((m) => ({ default: m.InvoicesListPage }))
);
const InvoiceFormPage = lazy(() =>
  import('@/features/billing/InvoiceFormPage').then((m) => ({ default: m.InvoiceFormPage }))
);
const InvoiceDetailPage = lazy(() =>
  import('@/features/billing/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage }))
);

// Service & Repair & Mechanic Workspace
const ServiceOverviewPage = lazy(() =>
  import('@/features/service/ServiceOverviewPage').then((m) => ({ default: m.ServiceOverviewPage }))
);
const AppointmentsListPage = lazy(() =>
  import('@/features/service/AppointmentsListPage').then((m) => ({ default: m.AppointmentsListPage }))
);
const ServiceJobsListPage = lazy(() =>
  import('@/features/service/ServiceJobsListPage').then((m) => ({ default: m.ServiceJobsListPage }))
);
const ServiceJobDetailPage = lazy(() =>
  import('@/features/service/ServiceJobDetailPage').then((m) => ({ default: m.ServiceJobDetailPage }))
);
const MechanicWorkspacePage = lazy(() =>
  import('@/features/service/MechanicWorkspacePage').then((m) => ({ default: m.MechanicWorkspacePage }))
);

// Finance & Insurance & Logistics
const FinanceOverviewPage = lazy(() =>
  import('@/features/finance/FinanceOverviewPage').then((m) => ({ default: m.FinanceOverviewPage }))
);
const PaymentsListPage = lazy(() =>
  import('@/features/payments/PaymentsListPage').then((m) => ({ default: m.PaymentsListPage }))
);
const InsurancePoliciesListPage = lazy(() =>
  import('@/features/insurance/InsurancePoliciesListPage').then((m) => ({ default: m.InsurancePoliciesListPage }))
);
const DeliveriesListPage = lazy(() =>
  import('@/features/delivery/DeliveriesListPage').then((m) => ({ default: m.DeliveriesListPage }))
);
const DeliveryDetailPage = lazy(() =>
  import('@/features/delivery/DeliveryDetailPage').then((m) => ({ default: m.DeliveryDetailPage }))
);

// Spare Parts, Reports, Notifications, Settings, 404
const SparePartsListPage = lazy(() =>
  import('@/features/spare-parts/SparePartsListPage').then((m) => ({ default: m.SparePartsListPage }))
);
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() =>
  import('@/features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotFound = lazy(() => import('@/components/feedback/NotFound').then((m) => ({ default: m.NotFound })));

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState label="Loading Titan Operations Platform..." />}>
        <Routes>
          {/* Public Landing & Auth Entry Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<LandingPage />} />
          <Route path="/about" element={<LandingPage />} />

          {/* New Public Auth Routes */}
          <Route path="/login" element={<AccountTypeSelectionPage />} />
          <Route path="/login/customer" element={<CustomerLoginPage />} />
          <Route path="/login/organization" element={<OrganizationLoginPage />} />
          <Route path="/register" element={<CustomerRegisterPage />} />
          <Route path="/register/customer" element={<CustomerRegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Authenticated Application Shell */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Explicit Role Workspace Route Aliases with Guards */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']} />
              }
            >
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['MECHANIC', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER', 'SUPER_ADMIN']}
                />
              }
            >
              <Route path="/service/dashboard" element={<MechanicDashboard />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['SALES_EMPLOYEE', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER', 'SUPER_ADMIN']}
                />
              }
            >
              <Route path="/sales/dashboard" element={<SalesDashboard />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'BRANCH_MANAGER',
                    'BRANCH_OWNER',
                    'FRANCHISE_MANAGER',
                    'FRANCHISE_OWNER',
                    'SUPER_ADMIN',
                  ]}
                />
              }
            >
              <Route path="/branch/dashboard" element={<BranchManagerDashboard />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'SUPER_ADMIN']}
                />
              }
            >
              <Route path="/franchise/dashboard" element={<FranchiseOwnerDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
            </Route>

            {/* Organization Routes (Forbidden for Customer) */}
            <Route element={<ProtectedRoute forbiddenRoles={['CUSTOMER']} requiredPermission="canViewBranches" />}>
              <Route path="/organization/franchises" element={<FranchisesListPage />} />
              <Route path="/organization/franchises/:id" element={<FranchiseDetailPage />} />
              <Route path="/organization/branches" element={<BranchesListPage />} />
              <Route path="/organization/branches/:id" element={<BranchDetailPage />} />
            </Route>

            <Route element={<ProtectedRoute forbiddenRoles={['CUSTOMER']} requiredPermission="canViewEmployees" />}>
              <Route path="/organization/employees" element={<EmployeesListPage />} />
              <Route path="/organization/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/organization/approvals" element={<EmployeeApprovalsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/organization/roles" element={<RolesPermissionsPage />} />
            </Route>

            {/* Customers */}
            <Route path="/customers" element={<CustomersListPage />} />
            <Route path="/customers/:id" element={<Customer360Page />} />

            {/* CRM (Forbidden for Customer and Mechanic) */}
            <Route element={<ProtectedRoute forbiddenRoles={['CUSTOMER', 'MECHANIC']} requiredPermission="canViewLeads" />}>
              <Route path="/crm/leads" element={<LeadsListPage />} />
              <Route path="/crm/leads/:id" element={<LeadDetailPage />} />
            </Route>

            {/* Inventory */}
            <Route path="/inventory/browse-trucks" element={<BrowseTrucksPage />} />
            <Route path="/inventory/vehicles" element={<VehiclesListPage />} />
            <Route path="/inventory/vehicles/new" element={<VehicleStudioPage />} />
            <Route path="/inventory/vehicles/:id" element={<VehicleDetailPage />} />
            <Route path="/inventory/vehicles/:id/edit" element={<VehicleStudioPage />} />

            {/* Sales */}
            <Route path="/sales" element={<SalesOverviewPage />} />
            <Route path="/sales/quotations" element={<QuotationsListPage />} />
            <Route path="/sales/quotations/new" element={<QuotationFormPage />} />
            <Route path="/sales/quotations/:id" element={<QuotationDetailPage />} />
            <Route path="/sales/bookings" element={<BookingsListPage />} />
            <Route path="/sales/bookings/:id" element={<BookingDetailPage />} />

            {/* Billing */}
            <Route path="/billing/invoices" element={<InvoicesListPage />} />
            <Route path="/billing/invoices/new" element={<InvoiceFormPage />} />
            <Route path="/billing/invoices/:id" element={<InvoiceDetailPage />} />

            {/* Service & Mechanic */}
            <Route path="/service" element={<ServiceOverviewPage />} />
            <Route path="/service/appointments" element={<AppointmentsListPage />} />
            <Route path="/service/jobs" element={<ServiceJobsListPage />} />
            <Route path="/service/jobs/:id" element={<ServiceJobDetailPage />} />
            
            <Route element={<ProtectedRoute forbiddenRoles={['CUSTOMER', 'SALES_EMPLOYEE']} requiredPermission="canViewServiceJobs" />}>
              <Route path="/service/mechanic-workspace" element={<MechanicWorkspacePage />} />
            </Route>

            {/* Finance & Insurance */}
            <Route element={<ProtectedRoute forbiddenRoles={['CUSTOMER']} requiredPermission="canViewFinance" />}>
              <Route path="/finance" element={<FinanceOverviewPage />} />
              <Route path="/finance/applications" element={<FinanceOverviewPage />} />
            </Route>

            <Route path="/payments" element={<PaymentsListPage />} />
            <Route path="/insurance" element={<InsurancePoliciesListPage />} />

            {/* Delivery */}
            <Route path="/delivery" element={<DeliveriesListPage />} />
            <Route path="/delivery/:id" element={<DeliveryDetailPage />} />

            {/* Spare Parts */}
            <Route path="/spare-parts" element={<SparePartsListPage />} />

            {/* Analytics, Notifications, Settings */}
            <Route element={<ProtectedRoute forbiddenRoles={['CUSTOMER']} requiredPermission="canViewReports" />}>
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
            
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Fallback 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
