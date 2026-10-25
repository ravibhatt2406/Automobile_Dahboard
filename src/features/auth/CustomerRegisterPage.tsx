import React, { useState } from 'react';
import { useAuth } from '@/app/providers/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Phone, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export const CustomerRegisterPage: React.FC = () => {
  const { registerCustomer, isLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number (e.g. +91 9876543210).';
    }


    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.termsAccepted) {
      errors.termsAccepted = 'You must accept the terms of service and privacy policy.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    try {
      const userProfile = await registerCustomer({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        termsAccepted: formData.termsAccepted,
      });

      // Redirect to customer dashboard if already linked; otherwise to profile onboarding
      if (userProfile.customerId || userProfile.customerProfile) {
        navigate('/customer/dashboard');
      } else {
        navigate('/customer/onboarding');
      }
    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Please verify your details.';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('email')) {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
      } else {
        setGeneralError(msg);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-[#E5E5E5] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        {/* Left Side: Brand Context */}
        <div className="md:col-span-5 bg-[#111111] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F5A800] text-[#111111] flex items-center justify-center font-black text-lg">
                T
              </div>
              <span className="text-sm font-black tracking-tight text-white uppercase">
                TITAN <span className="text-[#F5A800]">AUTO</span>
              </span>
            </Link>

            <div className="pt-6 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#F5A800] text-[10px] font-bold uppercase tracking-widest font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> CLIENT ONBOARDING
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight">
                Create Your Customer Portal Account
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Register as a retail or fleet customer to browse inventory, request quotations, track vehicle orders, book workshop service, and view billing history.
              </p>
            </div>

            <div className="pt-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800] shrink-0" /> Immediate access to quotation requests
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800] shrink-0" /> Real-time service appointment scheduling
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800] shrink-0" /> Order status and invoice history tracking
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <Link to="/login" className="text-zinc-400 hover:text-white transition-colors">
              ← Switch Account Type
            </Link>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="md:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-white overflow-y-auto max-h-[85vh]">
          <div className="max-w-md mx-auto w-full space-y-5">
            <div>
              <span className="text-[10px] font-bold text-[#F5A800] uppercase tracking-widest font-mono block">
                NEW CUSTOMER SIGN UP
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#111111] mt-1">
                Create Account
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Fill in your details below or sign up with Google.
              </p>
            </div>

            {generalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Official Google Sign-Up Button */}
            <div className="space-y-3">
              <GoogleSignInButton
                text="signup_with"
                theme="outline"
                shape="rectangular"
                width={340}
                onError={(err) => setGeneralError(err)}
              />

              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-zinc-200 w-full" />
                <span className="bg-white px-3 text-[10px] text-zinc-400 uppercase font-mono tracking-wider shrink-0">
                  Or register with email
                </span>
                <div className="border-t border-zinc-200 w-full" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className={`w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border ${
                      fieldErrors.name ? 'border-rose-400 ring-1 ring-rose-400' : 'border-zinc-200'
                    } text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="customer@domain.com"
                    className={`w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border ${
                      fieldErrors.email ? 'border-rose-400 ring-1 ring-rose-400' : 'border-zinc-200'
                    } text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>

                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 9876543210 (optional)"
                    className={`w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border ${
                      fieldErrors.phone ? 'border-rose-400 ring-1 ring-rose-400' : 'border-zinc-200'
                    } text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Min 8 characters"
                      className={`w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border ${
                        fieldErrors.password ? 'border-rose-400 ring-1 ring-rose-400' : 'border-zinc-200'
                      } text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]`}
                    />
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[10px] text-rose-600 mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border ${
                        fieldErrors.confirmPassword ? 'border-rose-400 ring-1 ring-rose-400' : 'border-zinc-200'
                      } text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]`}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-[10px] text-rose-600 mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Terms Acceptance */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-zinc-300 text-[#F5A800] focus:ring-[#F5A800] accent-[#F5A800]"
                  />
                  <span className="text-xs text-zinc-600 leading-tight">
                    I agree to the{' '}
                    <span className="text-zinc-900 font-semibold underline">Terms of Service</span> and{' '}
                    <span className="text-zinc-900 font-semibold underline">Privacy Policy</span>.
                  </span>
                </label>
                {fieldErrors.termsAccepted && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.termsAccepted}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Customer Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-[#E5E5E5] text-center text-xs text-zinc-600">
              Already have an account?{' '}
              <Link to="/login/customer" className="font-semibold text-zinc-900 hover:text-[#F5A800] transition-colors underline">
                Sign In to Customer Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
