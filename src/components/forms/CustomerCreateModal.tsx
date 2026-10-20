import React, { useState } from 'react';
import { X, UserPlus, Building2, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { Branch } from '@/types/domain';

interface CustomerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branches: Branch[];
  activeBranchId?: string;
  isSuperAdmin?: boolean;
}

export const CustomerCreateModal: React.FC<CustomerCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  branches,
  activeBranchId,
  isSuperAdmin = false,
}) => {
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [branchId, setBranchId] = useState(activeBranchId && activeBranchId !== 'ALL' ? activeBranchId : '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Rajasthan');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validation
    if (!name.trim()) {
      setFormError('Contact or Customer name is required.');
      return;
    }

    if (customerType === 'BUSINESS' && !companyName.trim()) {
      setFormError('Company or Corporate name is required for Business accounts.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || !/^[+]?[\d-]{7,16}$/.test(cleanPhone)) {
      setFormError('Please enter a valid phone number (7-16 digits).');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const cleanGstin = gstin.trim().toUpperCase();
    if (cleanGstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGstin)) {
      setFormError('Invalid GSTIN format (15 characters: e.g. 08ABCDE1234F1Z5).');
      return;
    }

    const cleanPan = pan.trim().toUpperCase();
    if (cleanPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      setFormError('Invalid PAN format (10 characters: e.g. ABCDE1234F).');
      return;
    }

    setLoading(true);
    try {
      await customerService.createCustomer({
        name: name.trim(),
        customerType,
        companyName: customerType === 'BUSINESS' ? companyName.trim() : undefined,
        phone: cleanPhone,
        email: cleanEmail || undefined,
        preferredBranchId: branchId || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        gstin: cleanGstin || undefined,
        pan: cleanPan || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create customer record in database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 border border-zinc-200 shadow-2xl my-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-sm">Register Commercial Customer</h3>
              <p className="text-xs text-zinc-500">Add an authorized customer profile directly to dealership ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Customer Type Selector */}
          <div>
            <label className="block text-zinc-700 font-semibold mb-1.5">Account Classification</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCustomerType('INDIVIDUAL')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  customerType === 'INDIVIDUAL'
                    ? 'bg-[#111111] text-[#F5A800] border-zinc-900 shadow-xs'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <User className="w-4 h-4" />
                Individual / Fleet Owner
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('BUSINESS')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  customerType === 'BUSINESS'
                    ? 'bg-[#111111] text-[#F5A800] border-zinc-900 shadow-xs'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Corporate / Logistics Co.
              </button>
            </div>
          </div>

          {/* Primary Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                {customerType === 'BUSINESS' ? 'Contact Person Name *' : 'Customer Full Name *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {customerType === 'BUSINESS' ? (
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Company / Legal Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Freight Logistics Pvt Ltd"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Fleet / Business Alias (Optional)</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Sharma Transport"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Primary Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@apexlogistics.in"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Assigned Dealership Branch */}
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Responsible Dealership Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">-- Select Branch Assignment --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code}) - {b.city || 'Dealership'}
                </option>
              ))}
            </select>
          </div>

          {/* Statutory Identifiers: GSTIN & PAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                GSTIN {customerType === 'BUSINESS' ? '(Recommended)' : '(Optional)'}
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="08AABCT1332L1Z4"
                maxLength={15}
                className="w-full px-3 py-2 font-mono border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">PAN Number (Optional)</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="AABCT1332L"
                maxLength={10}
                className="w-full px-3 py-2 font-mono border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Location & Address */}
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Operational Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Plot 42, Transport Nagar"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Jaipur"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Rajasthan"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="302003"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
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
                  Saving Customer...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Save Customer Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
