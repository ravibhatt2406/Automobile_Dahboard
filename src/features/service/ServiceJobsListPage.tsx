import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { ServiceJob } from '@/types/domain';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceManagementService } from '@/services/service.service';
import { branchService } from '@/services/branch.service';
import { vehicleService } from '@/services/vehicle.service';
import { Plus, Search, Wrench, Clock, CheckCircle2, AlertCircle, X, ShieldAlert, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { useScope } from '@/app/providers/ScopeContext';
import { BranchFilterBar } from '@/components/data-display/BranchFilterBar';

export const ServiceJobsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const {
    selectedBranchId,
    selectedFranchiseId,
    activeBranchName,
    activeFranchiseName,
  } = useScope();

  const isCustomer = activeRole === 'CUSTOMER';

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form State for New Job Card
  const [newJobBranchId, setNewJobBranchId] = useState('');
  const [newJobCustomerId, setNewJobCustomerId] = useState('');
  const [newJobVehicleId, setNewJobVehicleId] = useState('');
  const [newJobAdvisorId, setNewJobAdvisorId] = useState('');
  const [newJobComplaint, setNewJobComplaint] = useState('');
  const [newJobEstimatedCost, setNewJobEstimatedCost] = useState('');
  const [newJobOdometer, setNewJobOdometer] = useState('');
  const [newJobFuelLevel, setNewJobFuelLevel] = useState('50%');
  const [newJobNotes, setNewJobNotes] = useState('');

  // Queries
  const { data: jobsData, isLoading, error: queryError } = useQuery({
    queryKey: [
      'serviceJobs',
      search,
      selectedBranchId,
      selectedFranchiseId,
      selectedStatus,
      startDate,
      endDate,
    ],
    queryFn: () =>
      serviceManagementService.getServiceJobs({
        search: search || undefined,
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        franchiseId: selectedFranchiseId !== 'ALL' ? selectedFranchiseId : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getBranches(),
  });
  const branches = branchesData?.data || [];

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => serviceManagementService.getCustomers(),
    enabled: isCreateModalOpen,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-list', newJobBranchId],
    queryFn: () => vehicleService.getVehicles({ branchId: newJobBranchId || undefined, pageSize: 100 }),
    enabled: isCreateModalOpen,
  });
  const vehicles = vehiclesData?.data || [];

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-advisors', newJobBranchId],
    queryFn: () => serviceManagementService.getEmployees({ branchId: newJobBranchId || undefined }),
    enabled: isCreateModalOpen && !!newJobBranchId,
  });

  // Filter employees for Service Advisors
  const serviceAdvisors = employees.filter((emp: any) =>
    emp.designation?.toLowerCase().includes('advisor') ||
    emp.roleAssignments?.some((ra: any) => ra.role?.name === 'SERVICE_ADVISOR') ||
    emp.status === 'ACTIVE'
  );

  const createJobMutation = useMutation({
    mutationFn: (data: any) => serviceManagementService.createServiceJob(data),
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: ['serviceJobs'] });
      setIsCreateModalOpen(false);
      resetForm();
      navigate(`/service/jobs/${newJob.id}`);
    },
    onError: (err: any) => {
      setCreateError(err?.message || 'Failed to create job card');
    },
  });

  const resetForm = () => {
    setNewJobBranchId('');
    setNewJobCustomerId('');
    setNewJobVehicleId('');
    setNewJobAdvisorId('');
    setNewJobComplaint('');
    setNewJobEstimatedCost('');
    setNewJobOdometer('');
    setNewJobFuelLevel('50%');
    setNewJobNotes('');
    setCreateError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobBranchId) {
      setCreateError('Please select a workshop branch');
      return;
    }
    if (!newJobCustomerId) {
      setCreateError('Please select a customer');
      return;
    }
    if (!newJobVehicleId) {
      setCreateError('Please select a vehicle asset');
      return;
    }
    if (!newJobAdvisorId) {
      setCreateError('Please select an active service advisor');
      return;
    }
    if (!newJobComplaint.trim()) {
      setCreateError('Customer complaint / service scope is required');
      return;
    }

    createJobMutation.mutate({
      branchId: newJobBranchId,
      customerId: newJobCustomerId,
      vehicleId: newJobVehicleId,
      serviceAdvisorId: newJobAdvisorId,
      complaint: newJobComplaint.trim(),
      estimatedCost: newJobEstimatedCost ? Number(newJobEstimatedCost) : undefined,
      odometer: newJobOdometer ? Number(newJobOdometer) : undefined,
      fuelLevel: newJobFuelLevel,
      notes: newJobNotes.trim() || undefined,
    });
  };

  const jobsList = jobsData?.data || [];
  const totalCount = jobsData?.total ?? jobsList.length;
  const inProgressCount = jobsList.filter((j) => ['IN_PROGRESS', 'DIAGNOSIS'].includes(j.status)).length;
  const readyCount = jobsList.filter((j) => ['QUALITY_CHECK', 'READY_FOR_DELIVERY'].includes(j.status)).length;
  const completedCount = jobsList.filter((j) => j.status === 'COMPLETED').length;

  const columns: Column<ServiceJob>[] = [
    {
      header: 'Job Card # & Dates',
      accessorKey: 'jobCardNumber',
      className: 'font-mono text-xs font-bold text-zinc-900',
      cell: (row: any) => (
        <div className="space-y-0.5">
          <span className="font-mono font-bold text-blue-600 block">{row.jobNumber || row.jobCardNumber}</span>
          <span className="text-[10px] text-zinc-400 font-sans block">Logged: {new Date(row.createdAt).toLocaleDateString()}</span>
          {row.estimatedCompletionTime && (
            <span className="text-[10px] text-amber-600 font-sans block flex items-center gap-1">
              Est: {new Date(row.estimatedCompletionTime).toLocaleDateString()}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Customer & Branch',
      accessorKey: 'customerName',
      cell: (row: any) => (
        <div>
          <span className="font-semibold text-xs text-zinc-900 block">{row.customerName}</span>
          <span className="text-[10px] text-zinc-500 font-mono block">Branch: {row.branchName}</span>
        </div>
      ),
    },
    {
      header: 'Vehicle & Asset',
      accessorKey: 'vehicleVin',
      cell: (row: any) => (
        <div>
          <span className="font-mono text-xs font-semibold text-zinc-900 block">{row.vehicleVin || row.vehicle?.vin || '—'}</span>
          <span className="text-[11px] text-zinc-500 block truncate max-w-[140px]">
            {row.vehicleModel || row.vehicle?.variant?.name || 'Commercial Truck'}
          </span>
          {row.vehicle?.registrationNumber && (
            <span className="text-[10px] text-zinc-400 font-mono block">RC: {row.vehicle.registrationNumber}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Complaint / Diagnosis',
      accessorKey: 'complaint',
      className: 'max-w-xs',
      cell: (row: any) => (
        <div className="text-xs space-y-1">
          <p className="text-zinc-800 line-clamp-2 leading-relaxed font-medium">{row.complaint}</p>
          {row.diagnosis && (
            <p className="text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded line-clamp-1">
              <span className="font-semibold">Diag:</span> {row.diagnosis}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Workshop Staff',
      accessorKey: 'mechanicName',
      cell: (row: any) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400 font-medium">Adv:</span>
            <span className="text-zinc-700 font-medium">{row.advisorName || '—'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400 font-medium">Tech:</span>
            <span className={row.mechanicName !== 'Unassigned' ? 'text-zinc-800 font-medium' : 'text-zinc-400 italic'}>
              {row.mechanicName || 'Unassigned'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Parts Requisition',
      accessorKey: 'status',
      cell: (row: any) => {
        if (row.hasPendingParts || row.status === 'WAITING_FOR_PARTS') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold rounded-full">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              {row.pendingPartsCount > 0 ? `${row.pendingPartsCount} Pending` : 'Awaiting Parts'}
            </span>
          );
        }
        if (row.jobParts && row.jobParts.length > 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-50 text-zinc-700 border border-zinc-200 text-[10px] font-medium rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {row.jobParts.length} Allocated
            </span>
          );
        }
        return <span className="text-xs text-zinc-400 italic">None</span>;
      },
    },
    {
      header: 'Estimated Cost',
      accessorKey: 'estimatedCost',
      cell: (row: any) => (
        <div className="text-xs">
          <span className="font-mono font-semibold text-zinc-900 block">
            {row.estimatedCost ? `₹${row.estimatedCost.toLocaleString()}` : '—'}
          </span>
          {row.actualCost > 0 && (
            <span className="text-[10px] text-zinc-500 font-mono block">
              Act: ₹{row.actualCost.toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/service/jobs/${row.id}`)}
          className="px-2.5 py-1 bg-zinc-900 hover:bg-black text-[#F5A800] text-xs font-semibold rounded transition-colors shadow-xs"
        >
          Manage
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Repair Jobs"
        subtitle="Workshop job cards, diagnostics, parts consumption, overhaul logs, and Quality Control"
        breadcrumbItems={[{ label: 'Service' }, { label: 'Repair Jobs' }]}
        actions={
          !isCustomer && (
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Open New Job Card
            </button>
          )
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-blue-500" /> Total Active Jobs
          </span>
          <span className="text-2xl font-bold font-mono text-zinc-900 block">{totalCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Work In Progress
          </span>
          <span className="text-2xl font-bold font-mono text-amber-600 block">{inProgressCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Ready / QC
          </span>
          <span className="text-2xl font-bold font-mono text-indigo-600 block">{readyCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed Overhauls
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-600 block">{completedCount}</span>
        </div>
      </div>

      {/* 7 Core Workshop Stages Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-200">
        {[
          { label: 'All Jobs', value: 'ALL' },
          { label: 'Open', value: 'OPEN,CHECKED_IN', hint: 'Logged' },
          { label: 'In Progress', value: 'DIAGNOSIS,WAITING_FOR_APPROVAL,IN_PROGRESS', hint: 'Active Bay' },
          { label: 'Awaiting Parts', value: 'WAITING_FOR_PARTS', hint: 'Parts Hold' },
          { label: 'Ready for QC', value: 'QUALITY_CHECK', hint: 'Inspection' },
          { label: 'Ready for Delivery', value: 'READY_FOR_DELIVERY', hint: 'Gate Pass' },
          { label: 'Delivered', value: 'COMPLETED', hint: 'Handover' },
          { label: 'Cancelled', value: 'CANCELLED', hint: 'Voided' },
        ].map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-zinc-900 text-[#F5A800] shadow-xs'
                  : 'bg-white hover:bg-zinc-50 text-zinc-600 border border-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.hint && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                    isActive ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {tab.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Branch Cascading Filters */}
      <BranchFilterBar
        searchPlaceholder="Search by Job Card #, VIN, or customer name..."
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusOptions={[
          { label: 'All Statuses', value: 'ALL' },
          { label: 'Open (Logged)', value: 'OPEN' },
          { label: 'Checked-in', value: 'CHECKED_IN' },
          { label: 'Diagnosis', value: 'DIAGNOSIS' },
          { label: 'Waiting Approval', value: 'WAITING_FOR_APPROVAL' },
          { label: 'In Progress', value: 'IN_PROGRESS' },
          { label: 'Waiting For Parts', value: 'WAITING_FOR_PARTS' },
          { label: 'Quality Check', value: 'QUALITY_CHECK' },
          { label: 'Ready For Delivery', value: 'READY_FOR_DELIVERY' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ]}
        showDateRange={true}
        startDate={startDate}
        endDate={endDate}
        onDateChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        onReset={() => {
          setSearch('');
          setSelectedStatus('ALL');
          setStartDate('');
          setEndDate('');
        }}
      />

      {queryError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Failed to load service jobs from database: {(queryError as any)?.message || 'Server error'}</span>
        </div>
      )}

      {/* Table */}
      <DataTable<ServiceJob>
        columns={columns}
        data={jobsList}
        isLoading={isLoading}
        emptyTitle="No service jobs found"
        emptyDescription="No workshop repair cards match the selected branch and status filters."
        emptyActionLabel={!isCustomer ? "Open New Job Card" : undefined}
        onEmptyAction={() => {
          resetForm();
          setIsCreateModalOpen(true);
        }}
      />

      {/* Modal: Open New Job Card */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 border border-zinc-200 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Open New Workshop Job Card</h3>
                <p className="text-xs text-zinc-500">Initiate repair intake, vehicle assignment, and service scope</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Branch */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Workshop Branch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newJobBranchId}
                    onChange={(e) => {
                      setNewJobBranchId(e.target.value);
                      setNewJobVehicleId('');
                      setNewJobAdvisorId('');
                    }}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                    required
                  >
                    <option value="">-- Select Workshop Branch --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Advisor */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Service Advisor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newJobAdvisorId}
                    onChange={(e) => setNewJobAdvisorId(e.target.value)}
                    disabled={!newJobBranchId}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800] disabled:opacity-50"
                    required
                  >
                    <option value="">-- Select Service Advisor --</option>
                    {serviceAdvisors.map((sa: any) => (
                      <option key={sa.id} value={sa.id}>
                        {sa.firstName} {sa.lastName} ({sa.designation || 'Advisor'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Customer / Fleet Owner <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newJobCustomerId}
                    onChange={(e) => setNewJobCustomerId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                    required
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName || `${c.firstName || ''} ${c.lastName || ''}`.trim()} ({c.city || 'Commercial'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Vehicle Asset (VIN) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newJobVehicleId}
                    onChange={(e) => setNewJobVehicleId(e.target.value)}
                    disabled={!newJobBranchId}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800] disabled:opacity-50"
                    required
                  >
                    <option value="">-- Select Vehicle in Branch --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vin} — {v.model} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Odometer */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={newJobOdometer}
                    onChange={(e) => setNewJobOdometer(e.target.value)}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  />
                </div>

                {/* Estimated Cost */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={newJobEstimatedCost}
                    onChange={(e) => setNewJobEstimatedCost(e.target.value)}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  />
                </div>
              </div>

              {/* Complaint */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Customer Complaint / Repair Scope <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail primary defect or regular maintenance schedule requested by client..."
                  value={newJobComplaint}
                  onChange={(e) => setNewJobComplaint(e.target.value)}
                  className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Workshop Notes</label>
                <input
                  type="text"
                  placeholder="Optional internal intake remarks or urgency notes..."
                  value={newJobNotes}
                  onChange={(e) => setNewJobNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJobMutation.isPending}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {createJobMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Open Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
