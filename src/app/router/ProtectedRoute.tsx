import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { AccessRestricted } from '@/components/feedback/AccessRestricted';
import { UserRole, RolePermissions } from '@/types/roles';

interface ProtectedRouteProps {
  requiredPermission?: keyof RolePermissions;
  allowedRoles?: UserRole[];
  forbiddenRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermission,
  allowedRoles,
  forbiddenRoles,
}) => {
  const { isAuthenticated, activeRole, permissions } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Explicit forbidden role check (e.g., CUSTOMER trying to access internal dealership routes)
  if (forbiddenRoles && forbiddenRoles.includes(activeRole)) {
    return (
      <AccessRestricted reason="Your role does not have permission to access internal operational features." />
    );
  }

  // Allowed role check
  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    return (
      <AccessRestricted reason="Your active role is not authorized for this specific workspace." />
    );
  }

  // Required permission check
  if (requiredPermission && !permissions[requiredPermission]) {
    return (
      <AccessRestricted reason="Your authenticated account lacks the required permission for this feature." />
    );
  }

  return <Outlet />;
};
