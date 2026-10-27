import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { Customer } from '@/types/domain';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import {
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  Truck,
  FileText,
  Wrench,
  CheckCircle2,
  XCircle,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { csvDataService } from '@/services/csv-data.service';
import { CsvImportModal } from '@/components/forms/CsvImportModal';
import { CustomerCreateModal } from '@/components/forms/CustomerCreateModal';
import { branchService } from '@/services/branch.service';
import { useAuth } from '@/app/providers/AuthContext';
import { useScope } from '@/app/providers/ScopeContext';
import { BranchFilterBar } from '@/components/data-display/BranchFilterBar';

export const CustomersListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();
  const {
    selectedBranchId,
    selectedFranchiseId,
    activeBranchName,
    activeFranchiseName,
  } = useScope();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const isSuperAdmin = activeRole === 'SUPER_ADMIN';
  const canCreateCustomer = activeRole !== 'CUSTOMER';

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getBranches(),
  });
  const branches = branchesData?.data || [];

  // Compute tenant scope banner text
  const scopeDescription = isSuperAdmin
    ? selectedBranchId !== 'ALL'
      ? `Branch Directory: ${activeBranchName}`
      : selectedFranchiseId !== 'ALL'
      ? `Franchise Directory: ${activeFranchiseName}`
      : 'Global Fleet Directory (All Dealership Branches & Franchises)'
    : user?.assignedBranchName
    ? `Authorized Branch Directory: ${user.assignedBranchName}`
    : user?.assignedFranchiseName
    ? `Authorized Franchise Directory: ${user.assignedFranchiseName}`
    : 'Authorized Customer Directory';

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [
      'customers',
      selectedBranchId,
      selectedFranchiseId,
      searchTerm,
      customerTypeFilter,
      statusFilter,
      page,
      pageSize,
    ],
    queryFn: () =>
      customerService.getCustomers({
        search: searchTerm || undefined,
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        customerType: customerTypeFilter || undefined,
        status: statusFilter || undefined,
        page,
        pageSize,
      }),
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      await csvDataService.exportData('customers', {
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        search: searchTerm || undefined,
        customerType: customerTypeFilter || undefined,
        status: statusFilter || undefined,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to export customer directory.');
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      header: 'Client / Account',
      cell: (row: any) => {
        const isBusiness = row.customerType === 'BUSINESS';
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-900 block text-xs">
                {row.companyName || row.name}
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                  isBusiness
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                {row.customerType || 'INDIVIDUAL'}
              </span>
            </div>
            {row.companyName && row.name && row.companyName !== row.name && (
              <div className="text-[11px] text-zinc-600">Contact: {row.name}</div>
            )}
            {row.gstin && (
              <div className="text-[10px] font-mono text-zinc-500">GSTIN: {row.gstin}</div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Contact Information',
      cell: (row: any) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-800">
            <Phone className="w-3 h-3 text-amber-600 shrink-0" />
            <span className="font-mono font-medium">{row.phone || '—'}</span>
          </div>
          {row.email && (
            <div className="flex items-center gap-1.5 text-zinc-600 font-mono text-[11px] truncate max-w-xs">
              <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
              <span>{row.email}</span>
            </div>
          )}
          {(row.city || row.state) && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
              <span>{[row.city, row.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Branch Association',
      cell: (row: any) => {
        // Collect legitimate branch associations from quotations, bookings, vehicles, service jobs
        const branchMap = new Map<string, string>();

        if (Array.isArray(row.bookings)) {
          row.bookings.forEach((b: any) => {
            if (b.branch) branchMap.set(b.branch.id || b.branch.code, b.branch.name || b.branch.code);
          });
        }
        if (Array.isArray(row.vehicles)) {
          row.vehicles.forEach((v: any) => {
            if (v.branch) branchMap.set(v.branch.id || v.branch.code, v.branch.name || v.branch.code);
          });
        }
        if (Array.isArray(row.quotations)) {
          row.quotations.forEach((q: any) => {
            if (q.branch) branchMap.set(q.branch.id || q.branch.code, q.branch.name || q.branch.code);
          });
        }
        if (Array.isArray(row.serviceJobs)) {
          row.serviceJobs.forEach((sj: any) => {
            if (sj.branch) branchMap.set(sj.branch.id || sj.branch.code, sj.branch.name || sj.branch.code);
          });
        }

        const branchNames = Array.from(branchMap.values());

        if (branchNames.length === 0) {
          const franchiseName = row.franchiseLinks?.[0]?.franchise?.name;
          return (
            <div className="text-[11px] text-zinc-500 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-zinc-400" />
              <span>{franchiseName || 'Direct / Walk-in'}</span>
            </div>
          );
        }

        return (
          <div className="flex flex-wrap gap-1">
            {branchNames.map((bName, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300"
              >
                <Building2 className="w-3 h-3 text-amber-600" />
                {bName}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Fleet Operations',
      cell: (row: any) => {
        const vCount = row._count?.vehicles ?? row.vehicles?.length ?? 0;
        const bCount = row._count?.bookings ?? row.bookings?.length ?? 0;
        const sCount = row._count?.serviceJobs ?? row.serviceJobs?.length ?? 0;

        return (
          <div className="flex items-center gap-2 text-xs">
            <span
              className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-zinc-800 font-mono text-[11px]"
              title="Registered Vehicles"
            >
              <Truck className="w-3 h-3 text-blue-600" />
              {vCount}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-zinc-800 font-mono text-[11px]"
              title="Active Bookings"
            >
              <FileText className="w-3 h-3 text-emerald-600" />
              {bCount}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-zinc-800 font-mono text-[11px]"
              title="Service Repair Jobs"
            >
              <Wrench className="w-3 h-3 text-amber-600" />
              {sCount}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status || 'ACTIVE'} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/customers/${row.id}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-black text-[#F5A800] border border-zinc-900 text-xs font-bold transition-colors shadow-xs"
        >
          <span>360 Ledger</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      ),
    },
  ];

  const totalRecords = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-5">
      {/* Page Header with Scope Badge & Export/Import Controls */}
      <PageHeader
        title="Commercial Fleet Customer Directory"
        subtitle={scopeDescription}
        breadcrumbItems={[{ label: 'Organization' }, { label: 'Customer Directory' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              id="btn-export-csv"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-colors shadow-sm"
            >
              {exporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-amber-400" />
              )}
              Export Directory (.CSV)
            </button>
            <button
              id="btn-import-csv"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              Import CSV
            </button>
            {canCreateCustomer && (
              <button
                id="btn-add-customer"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold rounded-lg border border-zinc-900 transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Customer
              </button>
            )}
          </div>
        }
      />

      {/* Unified Cascading Branch & Filter Bar */}
      <BranchFilterBar
        searchPlaceholder="Search by client name, phone, email, or company..."
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        extraFilters={
          <div className="flex items-center gap-2">
            <select
              value={customerTypeFilter}
              onChange={(e) => {
                setCustomerTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
            >
              <option value="">All Account Types</option>
              <option value="BUSINESS" className="bg-zinc-900 text-white">Corporate / Business</option>
              <option value="INDIVIDUAL" className="bg-zinc-900 text-white">Individual / Fleet</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE" className="bg-zinc-900 text-white">Active Accounts</option>
              <option value="INACTIVE" className="bg-zinc-900 text-white">Inactive Accounts</option>
            </select>
          </div>
        }
        onReset={() => {
          setSearchTerm('');
          setCustomerTypeFilter('');
          setStatusFilter('');
          setPage(1);
        }}
      />

      {/* Authorized Customer Records DataTable */}
      <DataTable<Customer>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading || isFetching}
        emptyTitle="No authorized customer records found"
        emptyDescription="No customer accounts match your current branch scope or search filters. Customers register independently via the public self-registration portal."
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-[#111111] border border-zinc-800 rounded-xl text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Page <span className="font-bold text-zinc-200">{page}</span> of{' '}
              <span className="font-bold text-zinc-200">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entity="customers"
        title="Import Customers (CSV)"
        onImportComplete={() => refetch()}
      />

      {/* Register Customer Modal */}
      <CustomerCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
        branches={branches}
        activeBranchId={selectedBranchId}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
};
