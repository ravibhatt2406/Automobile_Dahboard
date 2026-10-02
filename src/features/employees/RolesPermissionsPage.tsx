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

      <div className="cockpit-card rounded-xl border border-slate-800 overflow-x-auto p-4">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
            <tr>
              <th className="p-3 uppercase">Permission Capability</th>
              {rolesList.map((role) => (
                <th key={role} className="p-3 text-center uppercase min-w-[120px]">
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {permissionKeys.map((p) => (
              <tr key={p.key} className="hover:bg-slate-850/40">
                <td className="p-3 font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  {p.label}
                </td>
                {rolesList.map((role) => {
                  const allowed = ROLE_PERMISSIONS[role][p.key];
                  return (
                    <td key={role} className="p-3 text-center">
                      {allowed ? (
                        <span className="inline-flex p-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex p-1 rounded bg-slate-900 text-slate-600 border border-slate-800">
                          <X className="w-3.5 h-3.5" />
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
  );
};
