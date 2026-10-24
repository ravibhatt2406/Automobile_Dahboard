import React, { useState, useEffect } from 'react';
import { X, Target, Save, AlertCircle, Loader2, User, Building2, Calendar, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { crmService } from '@/services/crm.service';
import { customerService } from '@/services/customer.service';
import { branchService } from '@/services/branch.service';
import { useQuery } from '@tanstack/react-query';
import { Customer, Branch } from '@/types/domain';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any | null;
  activeBranchId?: string;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  activeBranchId,
}) => {
  const isEditing = Boolean(initialData);

  const [useExistingCustomer, setUseExistingCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [prospectName, setProspectName] = useState('');
  const [prospectPhone, setProspectPhone] = useState('');
  const [prospectEmail, setProspectEmail] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [branchId, setBranchId] = useState(activeBranchId && activeBranchId !== 'ALL' ? activeBranchId : '');
  const [interestedModel, setInterestedModel] = useState('Titan Heavy Prime 5530.S');
  const [expectedBudget, setExpectedBudget] = useState('4500000');
  const [source, setSource] = useState('DIRECT_WALKIN');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [expectedPurchaseDate, setExpectedPurchaseDate] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Queries for existing customers and branches
  const { data: customersData } = useQuery({
    queryKey: ['customers-lead-select'],
    queryFn: () => customerService.getCustomers({ pageSize: 100 }),
    enabled: isOpen,
  });
  const customers = customersData?.data || [];

  const { data: branchesData } = useQuery({
    queryKey: ['branches-lead-select'],
    queryFn: () => branchService.getBranches(),
    enabled: isOpen,
  });
  const branches = branchesData?.data || [];

  useEffect(() => {
    if (initialData) {
      setProspectName(initialData.customerName || initialData.customer?.name || '');
      setProspectPhone(initialData.phone || initialData.customer?.phone || '');
      setProspectEmail(initialData.email || initialData.customer?.email || '');
      setCompanyName(initialData.companyName || initialData.customer?.companyName || '');
      setInterestedModel(initialData.interestedModel || 'Titan Heavy Prime 5530.S');
      setExpectedBudget(initialData.expectedBudget ? String(initialData.expectedBudget) : '');
      setSource(initialData.source || 'DIRECT_WALKIN');
      setPriority(initialData.priority || 'MEDIUM');
      setNotes(initialData.notes || '');
      setBranchId(initialData.branchId || '');
    } else {
      setProspectName('');
      setProspectPhone('');
      setProspectEmail('');
      setCompanyName('');
      setInterestedModel('Titan Heavy Prime 5530.S');
      setExpectedBudget('4500000');
      setSource('DIRECT_WALKIN');
      setPriority('MEDIUM');
      setNotes('');
      setNextFollowUpDate('');
      if (activeBranchId && activeBranchId !== 'ALL') {
        setBranchId(activeBranchId);
      }
    }
  }, [initialData, activeBranchId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const effectiveBranchId = branchId || (branches[0]?.id);
    if (!effectiveBranchId) {
      setError('Please select a responsible dealership branch.');
      return;
    }

    if (useExistingCustomer && !selectedCustomerId) {
      setError('Please select an existing customer profile.');
      return;
    }

    if (!useExistingCustomer && !isEditing) {
      if (!prospectName.trim()) {
        setError('Prospect / Customer Name is required.');
        return;
      }
      const cleanPhone = prospectPhone.trim().replace(/\s+/g, '');
      if (!cleanPhone || cleanPhone.length < 7) {
        setError('Valid contact phone number is required.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isEditing && initialData?.id) {
        await crmService.updateLead(initialData.id, {
          interestedModel,
          expectedBudget: expectedBudget ? Number(expectedBudget) : undefined,
          priority: priority as any,
          source,
          notes,
          expectedPurchaseDate: expectedPurchaseDate ? new Date(expectedPurchaseDate).toISOString() : undefined,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined,
        });
      } else {
        await crmService.createLead({
          customerId: useExistingCustomer ? selectedCustomerId : undefined,
          prospectName: !useExistingCustomer ? prospectName.trim() : undefined,
          prospectPhone: !useExistingCustomer ? prospectPhone.trim() : undefined,
          prospectEmail: !useExistingCustomer && prospectEmail.trim() ? prospectEmail.trim() : undefined,
          companyName: !useExistingCustomer && companyName.trim() ? companyName.trim() : undefined,
          branchId: effectiveBranchId,
          interestedModel: interestedModel.trim(),
          expectedBudget: expectedBudget ? Number(expectedBudget) : undefined,
          priority,
          source,
          notes: notes.trim(),
          expectedPurchaseDate: expectedPurchaseDate ? new Date(expectedPurchaseDate).toISOString() : undefined,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to persist lead opportunity in database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-zinc-900 my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-600">
                <Target className="w-4 h-4" />
              </div>
              {isEditing ? 'Edit Lead Opportunity' : 'New CRM Lead Opportunity'}
            </h3>
            <button onClick={onClose} className="p-1 rounded text-zinc-400 hover:text-zinc-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Customer Link Mode */}
            {!isEditing && (
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="font-semibold text-zinc-700">Link to existing customer?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUseExistingCustomer(false)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      !useExistingCustomer ? 'bg-[#111111] text-[#F5A800]' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    New Prospect
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseExistingCustomer(true)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      useExistingCustomer ? 'bg-[#111111] text-[#F5A800]' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Existing Client
                  </button>
                </div>
              </div>
            )}

            {useExistingCustomer && !isEditing ? (
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Select Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">-- Choose Existing Dealership Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName ? `${c.companyName} (${c.name})` : c.name} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">Prospect / Contact Name *</label>
                    <input
                      type="text"
                      required={!isEditing}
                      value={prospectName}
                      onChange={(e) => setProspectName(e.target.value)}
                      placeholder="e.g. Vikram Singh"
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">Company / Fleet Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Singh Super Logistics"
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required={!isEditing}
                      value={prospectPhone}
                      onChange={(e) => setProspectPhone(e.target.value)}
                      placeholder="+91 98290 12345"
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={prospectEmail}
                      onChange={(e) => setProspectEmail(e.target.value)}
                      placeholder="vikram@singhlogistics.com"
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dealership Branch */}
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Responsible Branch *</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">-- Select Dealership Branch --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code}) - {b.city || 'Dealership'}
                  </option>
                ))}
              </select>
            </div>

            {/* Model & Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Interested Vehicle Model</label>
                <input
                  type="text"
                  value={interestedModel}
                  onChange={(e) => setInterestedModel(e.target.value)}
                  placeholder="e.g. Signa 4825.TK Heavy Tipper"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Expected Budget (INR)</label>
                <input
                  type="number"
                  value={expectedBudget}
                  onChange={(e) => setExpectedBudget(e.target.value)}
                  placeholder="4500000"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Source & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Lead Acquisition Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="DIRECT_WALKIN">Direct Dealership Walk-in</option>
                  <option value="WEBSITE_INQUIRY">Website / Digital Enquiry</option>
                  <option value="PHONE_INQUIRY">Phone / Telephonic Inquiry</option>
                  <option value="CUSTOMER_REFERRAL">Existing Customer Referral</option>
                  <option value="MARKETING_CAMP">Marketing Camp / Outreach</option>
                  <option value="FLEET_EXPO">Commercial Fleet Expo / Event</option>
                  <option value="OUTBOUND_CALL">Outbound Sales Prospecting</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium (Standard)</option>
                  <option value="HIGH">High (Hot Lead)</option>
                  <option value="URGENT">Urgent (Immediate Purchase)</option>
                </select>
              </div>
            </div>

            {/* Expected Purchase Date & Next Follow Up */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Expected Purchase Date</label>
                <input
                  type="date"
                  value={expectedPurchaseDate}
                  onChange={(e) => setExpectedPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Next Follow-Up</label>
                <input
                  type="datetime-local"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Commercial Requirement Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific tipper body requirements, chassis preference, financing needed..."
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg font-bold shadow-xs transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Opportunity...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-emerald-400" />
                    Save Opportunity
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
