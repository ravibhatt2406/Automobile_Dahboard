import React, { useState } from 'react';
import { useAuth } from '@/app/providers/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Building, Sparkles, ShieldCheck } from 'lucide-react';
import { UserRole } from '@/types/roles';

export const OrganizationLoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password.trim()) {
      setErrorMsg('Please enter your organizational credentials.');
      return;
    }
    setErrorMsg(null);
    try {
      const authenticatedUser = await login(emailOrPhone, password, 'organization');
      
      // Route based on authenticated user's actual role
      if (authenticatedUser.activeRole === 'SUPER_ADMIN') {
        navigate('/dashboard');
      } else if (authenticatedUser.activeRole === 'FRANCHISE_OWNER' || authenticatedUser.activeRole === 'FRANCHISE_MANAGER') {
        navigate('/dashboard');
      } else if (authenticatedUser.activeRole === 'BRANCH_MANAGER' || authenticatedUser.activeRole === 'BRANCH_OWNER') {
        navigate('/dashboard');
      } else if (authenticatedUser.activeRole === 'SALES_EMPLOYEE') {
        navigate('/dashboard');
      } else if (authenticatedUser.activeRole === 'MECHANIC') {
        navigate('/service/jobs');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check credentials.');
    }
  };

  const setDemoAccount = (email: string, pass: string) => {
    setEmailOrPhone(email);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-[#E5E5E5] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left Side: Enterprise Operations Context */}
        <div className="lg:col-span-5 bg-[#111111] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5A800] text-[#111111] flex items-center justify-center font-black text-xl">
                T
              </div>
              <span className="text-base font-black tracking-tight text-white uppercase">
                TITAN <span className="text-[#F5A800]">AUTO</span>
              </span>
            </Link>

            <div className="pt-6 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#F5A800] text-xs font-bold uppercase tracking-widest font-mono">
                <Building className="w-3.5 h-3.5" /> ENTERPRISE OPERATIONS
              </div>
              <h2 className="text-3xl font-black leading-tight tracking-tight">
                Dealership & Operations Control
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Secure access portal for franchise owners, branch managers, sales teams, and service technicians.
              </p>
            </div>

            <div className="pt-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F5A800]">
                <ShieldCheck className="w-4 h-4" /> Role-Based Access Control
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Your workspace dashboard and permitted features are automatically configured by your authenticated employee profile.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <Link to="/login" className="text-zinc-400 hover:text-white transition-colors">
              ← Switch Account Type
            </Link>
            <span className="text-[#F5A800]">Titan Enterprise v1.0</span>
          </div>
        </div>

        {/* Right Side: Organization Login Form */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <span className="text-[10px] font-bold text-[#F5A800] uppercase tracking-widest font-mono block">
                ORGANIZATION / BRANCH LOGIN
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#111111] mt-1">
                Employee Sign In
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Enter your authorized employee email address or phone number.
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
                    placeholder="employee@titanauto.com"
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
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Assistant for Evaluation */}
            <div className="pt-4 border-t border-[#E5E5E5] space-y-2">
              <span className="text-[11px] font-mono text-zinc-500 block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#F5A800]" /> Demo Organizational Accounts:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoAccount('admin@titanauto.com', 'Admin123!')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold text-left truncate transition-colors"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount('branchmanager@titanauto.com', 'Manager123!')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold text-left truncate transition-colors"
                >
                  Branch Manager
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount('sales@titanauto.com', 'Sales123!')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold text-left truncate transition-colors"
                >
                  Sales Executive
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount('mechanic@titanauto.com', 'Mechanic123!')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold text-left truncate transition-colors"
                >
                  Service Mechanic
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
