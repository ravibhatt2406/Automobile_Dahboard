import React, { useState } from 'react';
import { useAuth } from '@/app/providers/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, User, Sparkles, CheckCircle2 } from 'lucide-react';

export const CustomerLoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password.trim()) {
      setErrorMsg('Please enter your customer account email or phone number.');
      return;
    }
    setErrorMsg(null);
    try {
      await login(emailOrPhone, password, 'customer');
      navigate('/customer/dashboard');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Customer authentication failed.');
    }
  };

  const handleDemoFill = () => {
    setEmailOrPhone('customer@titanauto.com');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-[#E5E5E5] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
        {/* Left Side: Customer Brand Context */}
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
                <User className="w-3 h-3" /> CLIENT PORTAL
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight">
                Your Vehicle Fleet & Service Hub
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Log in to access active vehicle records, service appointments, invoices, and booking confirmations.
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800]" /> Real-time Vehicle Service History
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800]" /> Easy Service Appointment Booking
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800]" /> Direct Invoice & Payment Receipts
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <Link to="/login" className="text-zinc-400 hover:text-white transition-colors">
              ← Switch Account Type
            </Link>
          </div>
        </div>

        {/* Right Side: Customer Login Form */}
        <div className="md:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full space-y-6">
            <div>
              <span className="text-[10px] font-bold text-[#F5A800] uppercase tracking-widest font-mono block">
                CUSTOMER SIGN IN
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#111111] mt-1">
                Access Client Portal
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Enter your registered customer email or phone number.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Email Address or Phone
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="customer@titanauto.com"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-zinc-600 hover:text-[#111111]"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#E5E5E5] text-center">
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-xs font-semibold text-[#F5A800] hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Fill Demo Customer Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
