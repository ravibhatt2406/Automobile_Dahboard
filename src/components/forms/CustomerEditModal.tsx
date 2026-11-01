import React, { useState, useEffect } from 'react';
import { X, Edit3, Building2, User, AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { Customer, Branch } from '@/types/domain';

interface CustomerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer: Customer;
  branches: Branch[];
}

export const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customer,
  branches,
}) => {
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'BUSINESS'>(
    (customer.customerType as any)?.toUpperCase() === 'BUSINESS' || (customer.customerType as any)?.toUpperCase() === 'CORPORATE'
      ? 'BUSINESS'
      : 'INDIVIDUAL'
  );
  const [name, setName] = useState(customer.name || customer.contactPerson || '');
  const [companyName, setCompanyName] = useState(customer.companyName || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [email, setEmail] = useState(customer.email || '');
  const [preferredBranchId, setPreferredBranchId] = useState(customer.preferredBranchId || '');
  const [address, setAddress] = useState(customer.address || '');
  const [city, setCity] = useState(customer.city || '');
  const [state, setState] = useState(customer.state || 'Rajasthan');
  const [pincode, setPincode] = useState(customer.pincode || '');
  const [gstin, setGstin] = useState(customer.gstin || customer.taxId || '');
  const [pan, setPan] = useState((customer as any).pan || '');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setCustomerType(
        (customer.customerType as any)?.toUpperCase() === 'BUSINESS' || (customer.customerType as any)?.toUpperCase() === 'CORPORATE'
          ? 'BUSINESS'
          : 'INDIVIDUAL'
      );
      setName(customer.name || customer.contactPerson || '');
      setCompanyName(customer.companyName || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setPreferredBranchId(customer.preferredBranchId || '');
      setAddress(customer.address || '');
      setCity(customer.city || '');
      setState(customer.state || 'Rajasthan');
      setPincode(customer.pincode || '');
      setGstin(customer.gstin || customer.taxId || '');
      setPan((customer as any).pan || '');
    }
  }, [customer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Contact or Customer name is required.';
    }

    if (customerType === 'BUSINESS' && !companyName.trim()) {
      errs.companyName = 'Company name is required for Business accounts.';
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || !/^[+]?[\d-]{7,16}$/.test(cleanPhone)) {
      errs.phone = 'Valid phone number required (7-16 digits).';
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errs.email = 'Valid email format required.';
    }

    const cleanGstin = gstin.trim().toUpperCase();
    if (cleanGstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGstin)) {
      errs.gstin = 'Invalid GSTIN (15 chars: e.g. 08ABCDE1234F1Z5).';
    }

    const cleanPan = pan.trim().toUpperCase();
    if (cleanPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      errs.pan = 'Invalid PAN (10 chars: e.g. ABCDE1234F).';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setFormError('Please correct the highlighted fields before saving.');
      return;
    }

    setLoading(true);
    try {
      await customerService.updateCustomer(customer.id, {
        name: name.trim(),
        customerType: customerType as any,
        companyName: customerType === 'BUSINESS' ? companyName.trim() : name.trim(),
        phone: cleanPhone,
        email: cleanEmail || undefined,
        preferredBranchId: preferredBranchId || null,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        gstin: cleanGstin || undefined,
        pan: cleanPan || undefined,
      } as any);

      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update customer profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#F5A800] flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-zinc-900" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Edit Customer Profile</h2>
              <p className="text-xs text-zinc-500 font-mono">ID: {customer.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Account Classification */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2 uppercase tracking-wider">
              Customer Classification
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCustomerType('INDIVIDUAL')}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                  customerType === 'INDIVIDUAL'
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Individual / Owner-Operator</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('BUSINESS')}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                  customerType === 'BUSINESS'
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Business / Commercial Fleet</span>
              </button>
            </div>
          </div>

          {/* Identity Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Contact Person / Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Legal Name"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  fieldErrors.name ? 'border-rose-400' : 'border-zinc-200'
                }`}
                required
              />
              {fieldErrors.name && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.name}</p>}
            </div>

            {customerType === 'BUSINESS' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Company / Fleet Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Corporate Entity Name"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    fieldErrors.companyName ? 'border-rose-400' : 'border-zinc-200'
                  }`}
                  required
                />
                {fieldErrors.companyName && (
                  <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.companyName}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98290 12345"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  fieldErrors.phone ? 'border-rose-400' : 'border-zinc-200'
                }`}
                required
              />
              {fieldErrors.phone && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  fieldErrors.email ? 'border-rose-400' : 'border-zinc-200'
                }`}
              />
              {fieldErrors.email && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.email}</p>}
            </div>
          </div>

          {/* Branch & Tax Identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Preferred Branch</label>
              <select
                value={preferredBranchId}
                onChange={(e) => setPreferredBranchId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">No preference</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="08ABCDE1234F1Z5"
                maxLength={15}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase ${
                  fieldErrors.gstin ? 'border-rose-400' : 'border-zinc-200'
                }`}
              />
              {fieldErrors.gstin && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.gstin}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">PAN Card</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase ${
                  fieldErrors.pan ? 'border-rose-400' : 'border-zinc-200'
                }`}
              />
              {fieldErrors.pan && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.pan}</p>}
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Registered Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, building, industrial area"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Jaipur"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Rajasthan"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="302001"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-amber-400 text-xs font-bold transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
