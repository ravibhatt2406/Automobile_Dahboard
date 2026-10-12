import React, { useState } from 'react';
import { useAuth } from '@/app/providers/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import heroAsset from '@/assets/hero.png';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password.trim()) {
      setErrorMsg('Please enter your email/phone and password.');
      return;
    }
    setErrorMsg(null);
    try {
      await login(emailOrPhone, password, 'organization');
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-[#E5E5E5] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left Side: Brand Panel */}
        <div className="lg:col-span-6 bg-[#111111] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5A800] text-[#111111] flex items-center justify-center font-black text-xl">
                T
              </div>
              <span className="text-base font-black tracking-tight text-white uppercase">
                TITAN <span className="text-[#F5A800]">AUTO</span>
              </span>
            </Link>

            <div className="pt-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#F5A800] text-xs font-bold uppercase tracking-widest font-mono">
                <Sparkles className="w-3 h-3" /> ENTERPRISE PLATFORM
              </div>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
                Run your automotive operation from one place.
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm">
                Integrated franchise management, branch operations, vehicle tracking, and customer service lifecycle.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 mt-8 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Titan Platform v1.0</span>
            <span className="text-[#F5A800]">Secure RBAC Ready</span>
          </div>

          {/* Background image tint */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <img src={heroAsset} alt="Automotive Background" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Sign In</h1>
              <p className="text-xs text-zinc-500 mt-1">
                Enter your credentials to access your workspace.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
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
                    placeholder="name@titanauto.com or phone"
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
                    className="text-xs font-semibold text-[#111111] hover:text-[#F5A800] transition-colors"
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
                className="w-full h-11 mt-2 rounded-xl bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
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

            <div className="pt-4 text-center text-[11px] text-zinc-400 font-mono">
              Titan Automotive Operations Platform
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

