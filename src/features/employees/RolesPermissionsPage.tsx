import React from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { ROLE_LABELS, ROLE_PERMISSIONS, UserRole } from '@/types/roles';
import { ShieldCheck, Check, X } from 'lucide-react';

export const RolesPermissionsPage: React.FC = () => {
  const rolesList = Object.keys(ROLE_LABELS) as UserRole[];

  const permissionKeys: Array<{ key: keyof (typeof ROLE_PERMISSIONS)['SUPER_ADMIN']; label: string }> = [
    { key: 'canViewAllFranchises', label: 'View All Franchises' },
    { key: 'canManageFranchises', label: 'Manage Franchises' },
    { key: 'canViewBranches', label: 'View Dealership Branches' },
    { key: 'canManageBranches', label: 'Manage Branches' },
    { key: 'canViewEmployees', label: 'View Staff Personnel' },
    { key: 'canManageEmployees', label: 'Manage Staff Roles' },
    { key: 'canViewAllCustomers', label: 'View Client Accounts' },
    { key: 'canViewLeads', label: 'Access CRM Leads' },
    { key: 'canViewInventory', label: 'Access Vehicle Stock' },
    { key: 'canManageInventory', label: 'Modify Stock Inventory' },
    { key: 'canViewSales', label: 'Access Sales & Quotes' },
    { key: 'canViewServiceJobs', label: 'Access Service Bay Jobs' },
    { key: 'canViewFinance', label: 'Access Financial Ledgers' },
    { key: 'canViewReports', label: 'View Executive Analytics' },
    { key: 'canManageSettings', label: 'Manage Platform Settings' },
  ];

  return (
    <div>
      <PageHeader
        title="Role Access Matrix"
        subtitle="RBAC role definitions and frontend UX permissions model"
        breadcrumbItems={[{ label: 'Organization' }, { label: 'Roles & Permissions' }]}
      />

      <div className="cockpit-card rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Security & Permission Capabilities</h3>
            <p className="text-xs text-zinc-500">Overview of operational boundaries across user roles</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </span>
              Authorized
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-zinc-100 text-zinc-400 border border-zinc-200 flex items-center justify-center">
                <X className="w-3 h-3 stroke-[2]" />
              </span>
              Restricted
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-700 sticky left-0 bg-zinc-50 z-10">Permission Capability</th>
                {rolesList.map((role) => (
                  <th key={role} className="px-3 py-3 text-center font-bold text-zinc-800 min-w-[130px]">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-sans">
              {permissionKeys.map((p) => (
                <tr key={p.key} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-zinc-900 flex items-center gap-2 sticky left-0 bg-white group-hover:bg-zinc-50">
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{p.label}</span>
                  </td>
                  {rolesList.map((role) => {
                    const allowed = ROLE_PERMISSIONS[role][p.key];
                    return (
                      <td key={role} className="px-3 py-3 text-center">
                        {allowed ? (
                          <span
                            title={`${ROLE_LABELS[role]}: Allowed`}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                        ) : (
                          <span
                            title={`${ROLE_LABELS[role]}: Denied`}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-zinc-100 text-zinc-400 border border-zinc-200"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2]" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
