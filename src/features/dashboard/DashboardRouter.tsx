import React from 'react';
import { useAuth } from '@/app/providers/AuthContext';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { FranchiseOwnerDashboard } from './FranchiseOwnerDashboard';
import { FranchiseManagerDashboard } from './FranchiseManagerDashboard';
import { BranchOwnerDashboard } from './BranchOwnerDashboard';
import { BranchManagerDashboard } from './BranchManagerDashboard';
import { SalesDashboard } from './SalesDashboard';
import { ServiceAdvisorDashboard } from './ServiceAdvisorDashboard';
import { MechanicDashboard } from './MechanicDashboard';
import { CustomerDashboard } from './CustomerDashboard';
import { AccessRestricted } from '@/components/feedback/AccessRestricted';

export const DashboardRouter: React.FC = () => {
  const { activeRole } = useAuth();

  switch (activeRole) {
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    case 'FRANCHISE_OWNER':
      return <FranchiseOwnerDashboard />;
    case 'FRANCHISE_MANAGER':
      return <FranchiseManagerDashboard />;
    case 'BRANCH_OWNER':
      return <BranchOwnerDashboard />;
    case 'BRANCH_MANAGER':
      return <BranchManagerDashboard />;
    case 'SALES_EMPLOYEE':
      return <SalesDashboard />;
    case 'SERVICE_ADVISOR':
      return <ServiceAdvisorDashboard />;
    case 'MECHANIC':
      return <MechanicDashboard />;
    case 'CUSTOMER':
      return <CustomerDashboard />;
    default:
      return (
        <AccessRestricted reason="Your authenticated account does not have an active or valid operational role assigned. Please sign in with an authorized account or contact dealership administration." />
      );
  }
};
