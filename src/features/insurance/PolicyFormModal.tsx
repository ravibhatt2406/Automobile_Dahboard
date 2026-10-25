import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Save, AlertCircle, Loader2 } from 'lucide-react';
import { InsurancePolicy } from '@/types/domain';
import { insuranceService } from '@/services/insurance.service';
import { customerService } from '@/services/customer.service';
import { salesService } from '@/services/sales.service';

interface PolicyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: InsurancePolicy | null;
}

export const PolicyFormModal: React.FC<PolicyFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  // Form Fields
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [insurer, setInsurer] = useState('ICICI Lombard Commercial');
  const [policyType, setPolicyType] = useState('Comprehensive Commercial Fleet');
  const [coverageDetails, setCoverageDetails] = useState('Zero Depreciation, Engine & Gearbox Cover, Third Party Liability');
  const [premium, setPremium] = useState<number>(45000);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');
  const [documentKey, setDocumentKey] = useState('');

  // Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      if (initialData) {
        setCustomerId(initialData.customerId || '');
        setVehicleId(initialData.vehicleId || initialData.vehicle?.id || '');
        setBookingId(initialData.bookingId || '');
        setPolicyNumber(initialData.policyNumber || '');
        setInsurer(initialData.insurer || initialData.provider || 'ICICI Lombard Commercial');
        setPolicyType(initialData.policyType || initialData.type || 'Comprehensive Commercial Fleet');
        setCoverageDetails(initialData.coverageDetails || '');
        setPremium(initialData.premium || initialData.premiumAmount || 45000);
        setStartDate(initialData.startDate ? initialData.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setExpiryDate(initialData.expiryDate ? initialData.expiryDate.slice(0, 10) : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10));
        setStatus(initialData.status || 'ACTIVE');
        setNotes(initialData.notes || '');
        setDocumentKey(initialData.documentKey || '');
      } else {
        setCustomerId('');
        setVehicleId('');
        setBookingId('');
        setPolicyNumber(`POL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`);
        setInsurer('ICICI Lombard Commercial');
        setPolicyType('Comprehensive Commercial Fleet');
        setCoverageDetails('Zero Depreciation, Engine & Gearbox Cover, Third Party Liability');
        setPremium(45000);
        setStartDate(new Date().toISOString().slice(0, 10));
        setExpiryDate(new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10));
        setStatus('ACTIVE');
        setNotes('');
        setDocumentKey('');
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [custList, bookList] = await Promise.all([
        customerService.getCustomers({ pageSize: 100 }),
        salesService.getBookings({ pageSize: 100 }),
      ]);
      setCustomers(custList.data || []);
      setBookings(bookList.data || []);
    } catch {
      // Ignored
    } finally {
      setLoadingOptions(false);
    }
  };

  // Filter bookings when customer changes
  const customerBookings = customerId
    ? bookings.filter((b) => b.customerId === customerId)
    : bookings;

  // Handle booking selection -> automatically sets vehicle & customer
  const handleBookingChange = (bId: string) => {
    setBookingId(bId);
    const selected = bookings.find((b) => b.id === bId);
    if (selected) {
      if (selected.customerId) setCustomerId(selected.customerId);
      if (selected.vehicleId) setVehicleId(selected.vehicleId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEditing && !customerId) {
      setError('Please select an existing customer from the database.');
      return;
    }

    if (new Date(expiryDate) <= new Date(startDate)) {
      setError('Policy expiry date must be strictly after the start date.');
      return;
    }

    if (premium <= 0) {
      setError('Policy premium must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && initialData) {
        await insuranceService.updatePolicy(initialData.id, {
          insurer: insurer.trim(),
          policyType: policyType.trim(),
          premium: Number(premium),
          startDate: new Date(startDate).toISOString(),
          expiryDate: new Date(expiryDate).toISOString(),
          coverageDetails: coverageDetails.trim() || undefined,
          notes: notes.trim() || undefined,
          documentKey: documentKey.trim() || undefined,
          status,
        });
      } else {
        await insuranceService.createPolicy({
          customerId,
          bookingId: bookingId || undefined,
          vehicleId: vehicleId || undefined,
          insurer: insurer.trim(),
          policyType: policyType.trim(),
          premium: Number(premium),
          startDate: new Date(startDate).toISOString(),
          expiryDate: new Date(expiryDate).toISOString(),
          policyNumber: policyNumber.trim() || undefined,
          coverageDetails: coverageDetails.trim() || undefined,
          notes: notes.trim() || undefined,
          documentKey: documentKey.trim() || undefined,
          status,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save insurance policy.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            {isEditing ? 'Edit Commercial Insurance Policy' : 'Record New Commercial Fleet Policy'}
          </h3>
          <button onClick={onClose} className="p-1 rounded bg-zinc-100 text-zinc-500 hover:text-zinc-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Customer & Booking Selection (Mandatory for new records) */}
          {!isEditing && (
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
              <span className="font-mono font-bold text-[10px] uppercase text-zinc-400 block">
                Database Customer & Deal Relationship
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Select Customer *</label>
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      setBookingId('');
                      setVehicleId('');
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 bg-white text-xs focus:border-zinc-900 focus:outline-hidden"
                    required
                  >
                    <option value="">-- Choose Existing Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''} — {c.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Linked Deal Booking / Vehicle</label>
                  <select
                    value={bookingId}
                    onChange={(e) => handleBookingChange(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 bg-white text-xs focus:border-zinc-900 focus:outline-hidden"
                  >
                    <option value="">-- Select Booking (Resolves Vehicle) --</option>
                    {customerBookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookingNumber} {b.vehicle?.vin ? `| VIN: ${b.vehicle.vin.slice(-8)}` : ''} {b.branch?.name ? `(${b.branch.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Policy Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Policy Number *</label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="POL-12345"
                disabled={isEditing}
                className="w-full h-9 px-3 rounded-lg border border-zinc-300 font-mono text-xs focus:border-zinc-900 focus:outline-hidden disabled:bg-zinc-100"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Insurance Provider / Company *</label>
              <select
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 bg-white text-xs focus:border-zinc-900 focus:outline-hidden"
                required
              >
                <option value="ICICI Lombard Commercial">ICICI Lombard General Insurance</option>
                <option value="Tata AIG Commercial">Tata AIG General Insurance</option>
                <option value="HDFC ERGO General Insurance">HDFC ERGO General Insurance</option>
                <option value="Bajaj Allianz Commercial">Bajaj Allianz General Insurance</option>
                <option value="The New India Assurance">The New India Assurance Co.</option>
                <option value="SBI General Insurance">SBI General Insurance</option>
                <option value="Oriental Insurance">Oriental Insurance Company</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Policy Type *</label>
              <select
                value={policyType}
                onChange={(e) => setPolicyType(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 bg-white text-xs focus:border-zinc-900 focus:outline-hidden"
                required
              >
                <option value="Comprehensive Commercial Fleet">Comprehensive Package Fleet Policy</option>
                <option value="Third Party Liability Commercial">Third Party Property Damage & Liability</option>
                <option value="Zero Depreciation Commercial Carrier">Commercial Carrier Zero Depreciation</option>
                <option value="Own Damage Carrier Hull">Stand-Alone Own Damage (SAOD)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Annual Premium (₹) *</label>
              <input
                type="number"
                min={1}
                value={premium}
                onChange={(e) => setPremium(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-zinc-300 font-mono text-xs focus:border-zinc-900 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Policy Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-300 text-xs focus:border-zinc-900 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Policy Expiry Date *</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-300 text-xs focus:border-zinc-900 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Coverage Details & Endorsements</label>
            <input
              type="text"
              value={coverageDetails}
              onChange={(e) => setCoverageDetails(e.target.value)}
              placeholder="e.g. Engine Protect, Tyre & Rim cover, Towing allowance"
              className="w-full h-9 px-3 rounded-lg border border-zinc-300 text-xs focus:border-zinc-900 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Policy Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 bg-white text-xs focus:border-zinc-900 focus:outline-hidden"
              >
                <option value="ACTIVE">ACTIVE — Issued Policy</option>
                <option value="PENDING">PENDING — Underwriting Review</option>
                <option value="EXPIRED">EXPIRED — Term Ended</option>
                <option value="CANCELLED">CANCELLED — Policy Voided</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Supporting Document Reference</label>
              <input
                type="text"
                value={documentKey}
                onChange={(e) => setDocumentKey(e.target.value)}
                placeholder="docs/insurance/cert_01.pdf"
                className="w-full h-9 px-3 rounded-lg border border-zinc-300 text-xs focus:border-zinc-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Internal Dealership Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record any dealer endorsement notes or verified confirmation reference..."
              className="w-full p-2.5 rounded-lg border border-zinc-300 text-xs focus:border-zinc-900 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
            <span className="text-[10px] text-zinc-400 font-mono">
              Manual policy entry — verified with ledger
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-[#F5A800] font-bold flex items-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{submitting ? 'Saving...' : isEditing ? 'Update Policy' : 'Save Policy'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
