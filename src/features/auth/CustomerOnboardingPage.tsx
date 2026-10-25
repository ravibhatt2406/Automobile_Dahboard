import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { customerService } from '@/services/customer.service';
import { branchService } from '@/services/branch.service';
import { franchiseService } from '@/services/franchise.service';
import { Branch, Franchise } from '@/types/domain';
import {
  ShieldCheck,
  Building2,
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';

export const CustomerOnboardingPage: React.FC = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  // If already linked/has customer profile, go straight to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.customerId) {
      navigate('/customer/dashboard', { replace: true });
    }
  }, [isAuthenticated, user?.customerId, navigate]);

  // Form State
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');
  const [name, setName] = useState(
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
  );
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Rajasthan');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');

  // Dropdown options loaded from DB
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadFranchisesAndBranches() {
      try {
        setLoadingOptions(true);
        const [fRes, bList] = await Promise.all([
          franchiseService.getFranchises(),
          branchService.getPublicActiveBranches(),
        ]);
        setFranchises(fRes.data || []);
        setBranches(bList || []);
      } catch (err) {
        console.error('Failed to load franchises/branches:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadFranchisesAndBranches();
  }, []);

  // Filter branches by selected franchise
  const availableBranches = selectedFranchiseId
    ? branches.filter((b) => b.franchiseId === selectedFranchiseId)
    : branches;

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Full contact or customer name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters.';
    }

    if (customerType === 'BUSINESS') {
      if (!companyName.trim()) {
        errs.companyName = 'Company / Enterprise name is required for Business accounts.';
      }
      if (gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase())) {
        errs.gstin = 'Invalid GSTIN format (15 characters: e.g. 08ABCDE1234F1Z5).';
      }
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      errs.phone = 'Phone number is required.';
    } else if (!/^[+]?[\d-]{7,16}$/.test(cleanPhone)) {
      errs.phone = 'Valid phone number required (7-16 digits).';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Valid email address format required.';
    }

    if (pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase())) {
      errs.pan = 'Invalid PAN format (10 characters: e.g. ABCDE1234F).';
    }

    if (!selectedBranchId) {
      errs.branch = 'Please select your preferred dealership branch.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const cleanPhone = phone.trim().replace(/\s+/g, '');
      const cleanGstin = gstin.trim() ? gstin.trim().toUpperCase() : undefined;
      const cleanPan = pan.trim() ? pan.trim().toUpperCase() : undefined;

      await customerService.createCustomer({
        name: name.trim(),
        customerType,
        companyName: customerType === 'BUSINESS' ? companyName.trim() : undefined,
        phone: cleanPhone,
        email: email.trim().toLowerCase() || undefined,
        preferredBranchId: selectedBranchId,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        gstin: cleanGstin,
        pan: cleanPan,
      });

      // Refresh auth profile to synchronize linked customer profile
      await refreshUser();

      // Navigate to customer dashboard upon successful completion
      navigate('/customer/dashboard');
    } catch (err: any) {
      // Retain entered values and display informative error
      setFormError(err.message || 'Failed to complete profile onboarding. Please check your information and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-[#E5E5E5] shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-[#111111] text-white p-6 sm:p-8 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-[#F5A800]/20 text-[#F5A800] text-[11px] font-mono font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Titan Customer Onboarding
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Complete Your Commercial Profile
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Set up your commercial customer account and select your preferred branch to access truck quotations, bookings, and workshop telemetry.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {formError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">Onboarding Error</strong>
                <span>{formError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs font-sans">
            {/* Account Classification */}
            <div>
              <label className="block text-zinc-800 font-bold mb-2">
                1. Account Classification
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerType('INDIVIDUAL');
                    if (fieldErrors.companyName) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.companyName;
                        return copy;
                      });
                    }
                  }}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    customerType === 'INDIVIDUAL'
                      ? 'border-[#F5A800] bg-amber-50/50 ring-1 ring-[#F5A800]'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      customerType === 'INDIVIDUAL'
                        ? 'bg-[#F5A800] text-black'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 block text-xs">
                      Individual Owner / Retail
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Single-vehicle operator, independent trucker, or private owner
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerType('BUSINESS')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    customerType === 'BUSINESS'
                      ? 'border-[#F5A800] bg-amber-50/50 ring-1 ring-[#F5A800]'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      customerType === 'BUSINESS'
                        ? 'bg-[#F5A800] text-black'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 block text-xs">
                      Fleet Operator / Corporate
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Transport company, logistics contractor, or fleet enterprise
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              <label className="block text-zinc-800 font-bold">
                2. Profile Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
                    }}
                    placeholder="e.g. Ramesh Kumar Sharma"
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                  />
                  {fieldErrors.name && (
                    <span className="text-rose-600 text-[11px] mt-1 block">{fieldErrors.name}</span>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: '' }));
                    }}
                    placeholder="+91 98290 12345"
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                  />
                  {fieldErrors.phone && (
                    <span className="text-rose-600 text-[11px] mt-1 block">{fieldErrors.phone}</span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-700 font-semibold mb-1 font-mono">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
                    }}
                    placeholder="name@business.com"
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800] font-mono"
                  />
                  {fieldErrors.email && (
                    <span className="text-rose-600 text-[11px] mt-1 block">{fieldErrors.email}</span>
                  )}
                </div>

                {customerType === 'BUSINESS' && (
                  <>
                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">
                        Company / Business Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          if (fieldErrors.companyName) setFieldErrors((p) => ({ ...p, companyName: '' }));
                        }}
                        placeholder="e.g. Rajasthan Freight Carriers Pvt Ltd"
                        className="w-full h-10 px-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                      />
                      {fieldErrors.companyName && (
                        <span className="text-rose-600 text-[11px] mt-1 block">
                          {fieldErrors.companyName}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1 font-mono">
                        GSTIN (Optional)
                      </label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => {
                          setGstin(e.target.value.toUpperCase());
                          if (fieldErrors.gstin) setFieldErrors((p) => ({ ...p, gstin: '' }));
                        }}
                        placeholder="08ABCDE1234F1Z5"
                        maxLength={15}
                        className="w-full h-10 px-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800] font-mono uppercase"
                      />
                      {fieldErrors.gstin && (
                        <span className="text-rose-600 text-[11px] mt-1 block">{fieldErrors.gstin}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Preferred Branch Selection */}
            <div className="space-y-3 p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div>
                <label className="block text-zinc-900 font-bold mb-1">
                  3. Select Preferred Dealership Branch <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-zinc-500">
                  Select your primary service branch for quotes, vehicle delivery, and maintenance support.
                  You can change this at any time in Edit Account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-zinc-700 font-medium mb-1">
                    Filter by Franchise (Optional)
                  </label>
                  <select
                    value={selectedFranchiseId}
                    onChange={(e) => {
                      setSelectedFranchiseId(e.target.value);
                      setSelectedBranchId('');
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#F5A800]"
                  >
                    <option value="">All Dealership Networks</option>
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-medium mb-1">
                    Preferred Branch Location <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => {
                      setSelectedBranchId(e.target.value);
                      if (fieldErrors.branch) setFieldErrors((p) => ({ ...p, branch: '' }));
                    }}
                    disabled={loadingOptions}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-[#F5A800]"
                  >
                    <option value="">-- Choose Branch Location --</option>
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.city ? `(${b.city})` : ''}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.branch && (
                    <span className="text-rose-600 text-[11px] mt-1 block">{fieldErrors.branch}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>
                  Selecting a preferred branch does not limit your truck browsing. You can browse vehicles across all branches nationwide.
                </span>
              </div>
            </div>

            {/* Address Details (Optional) */}
            <div className="space-y-3">
              <label className="block text-zinc-800 font-bold">
                4. Operating Address (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-zinc-600 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Transport Yard, Industrial Area Road"
                    className="w-full h-9 px-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#F5A800]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Jaipur"
                    className="w-full h-9 px-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#F5A800]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Rajasthan"
                    className="w-full h-9 px-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#F5A800]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 302013"
                    className="w-full h-9 px-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#F5A800]"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[11px] text-zinc-500">
                By completing onboarding, your commercial profile will be linked to your portal account.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 bg-[#111111] hover:bg-black text-[#F5A800] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F5A800]" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
