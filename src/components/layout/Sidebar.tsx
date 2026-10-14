import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import {
  LayoutDashboard,
  Building,
  Store,
  Users,
  UserCheck,
  Target,
  ShoppingBag,
  Truck,
  Wrench,
  DollarSign,
  CreditCard,
  ShieldCheck,
  FileText,
  PackageCheck,
  Package,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckSquare,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { permissions, activeRole } = useAuth();

  const isCustomer = activeRole === 'CUSTOMER';
  const isMechanic = activeRole === 'MECHANIC';
  const isSales = activeRole === 'SALES_EMPLOYEE';
  const isBranchManager = activeRole === 'BRANCH_MANAGER';

  // Role-specific navigation definition
  const getNavigationItems = () => {
    if (isCustomer) {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Browse Trucks', path: '/inventory/browse-trucks', icon: Truck },
        { label: 'My Vehicles', path: '/inventory/vehicles', icon: ShieldCheck },
        { label: 'My Enquiries & Bookings', path: '/sales/bookings', icon: ShoppingBag },
        { label: 'Dealership Chat', path: '/customer/chat', icon: MessageSquare },
        { label: 'Payments', path: '/payments', icon: CreditCard },
        { label: 'Insurance & PUC', path: '/insurance', icon: ShieldCheck },
        { label: 'Documents & Invoices', path: '/billing/invoices', icon: FileText },
        { label: 'Service Booking & History', path: '/service/jobs', icon: Wrench },
        { label: 'Notifications', path: '/notifications', icon: Bell },
        { label: 'My Settings', path: '/settings', icon: Settings },
      ];
    }

    if (isMechanic) {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Assigned Service Jobs', path: '/service/jobs', icon: Wrench },
        { label: 'Mechanic Bay Workspace', path: '/service/mechanic-workspace', icon: Shield },
        { label: 'Service Appointments', path: '/service/appointments', icon: CheckSquare },
        { label: 'Customer Messages', path: '/chat', icon: MessageSquare },
        { label: 'Spare Parts Requisitions', path: '/spare-parts', icon: Package },
        { label: 'Notifications', path: '/notifications', icon: Bell },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    if (isSales) {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Customers', path: '/customers', icon: UserCheck },
        { label: 'Sales & Quotations', path: '/sales', icon: ShoppingBag },
        { label: 'Available Inventory', path: '/inventory/vehicles', icon: Truck },
        { label: 'Customer Bookings', path: '/sales/bookings', icon: PackageCheck },
        { label: 'Customer Messages', path: '/chat', icon: MessageSquare },
        { label: 'Notifications', path: '/notifications', icon: Bell },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    // Default enterprise / manager / admin navigation
    const nav = [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, show: true },
      {
        label: 'Customer Messages',
        path: '/chat',
        icon: MessageSquare,
        show: true,
      },
      {
        label: 'Franchises',
        path: '/organization/franchises',
        icon: Building,
        show: permissions.canViewAllFranchises,
      },
      {
        label: 'Branches',
        path: '/organization/branches',
        icon: Store,
        show: permissions.canViewBranches,
      },
      {
        label: 'Employees',
        path: '/organization/employees',
        icon: Users,
        show: permissions.canViewEmployees,
      },
      {
        label: 'Approvals',
        path: '/organization/approvals',
        icon: CheckSquare,
        show: permissions.canManageEmployees || isBranchManager,
      },
      {
        label: 'Roles & Permissions',
        path: '/organization/roles',
        icon: Shield,
        show: activeRole === 'SUPER_ADMIN',
      },
      {
        label: 'Customers',
        path: '/customers',
        icon: UserCheck,
        show: permissions.canViewAllCustomers,
      },
      {
        label: 'Sales Overview',
        path: '/sales',
        icon: ShoppingBag,
        show: permissions.canViewSales,
      },
      {
        label: 'Vehicle Inventory',
        path: '/inventory/vehicles',
        icon: Truck,
        show: permissions.canViewInventory,
      },
      {
        label: 'Service Operations',
        path: '/service/jobs',
        icon: Wrench,
        show: permissions.canViewServiceJobs,
      },
      {
        label: 'Finance',
        path: '/finance/applications',
        icon: DollarSign,
        show: permissions.canViewFinance,
      },
      {
        label: 'Payments',
        path: '/payments',
        icon: CreditCard,
        show: permissions.canViewFinance,
      },
      {
        label: 'Insurance',
        path: '/insurance',
        icon: ShieldCheck,
        show: permissions.canViewFinance,
      },
      {
        label: 'Billing & Invoices',
        path: '/billing/invoices',
        icon: FileText,
        show: permissions.canViewFinance,
      },
      {
        label: 'Delivery Logistics',
        path: '/delivery',
        icon: PackageCheck,
        show: permissions.canViewSales,
      },
      {
        label: 'Spare Parts Inventory',
        path: '/spare-parts',
        icon: Package,
        show: permissions.canViewServiceJobs,
      },
      {
        label: 'Analytics & Reports',
        path: '/reports',
        icon: BarChart3,
        show: permissions.canViewReports,
      },
      { label: 'Notifications', path: '/notifications', icon: Bell, show: true },
      { label: 'Settings', path: '/settings', icon: Settings, show: true },
    ];

    return nav.filter((item) => item.show);
  };

  const navItems = getNavigationItems();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 cockpit-sidebar transition-all duration-300 flex flex-col bg-white border-r border-[#E5E5E5] ${
          collapsed ? 'w-16' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5]">
          {!collapsed && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 font-mono">
              <Shield className="w-3.5 h-3.5 text-[#F5A800]" /> {activeRole.replace('_', ' ')}
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors ml-auto"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-[#111111] font-semibold border-l-3 border-[#F5A800]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* System Version Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-[#E5E5E5] bg-zinc-50 text-[10px] font-mono text-zinc-500 flex justify-between items-center">
            <span>Titan Platform v1.0</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="API Ready" />
          </div>
        )}
      </aside>
    </>
  );
};
