import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ForgotPasswordPage: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOrPhone.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-4 relative font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl border border-[#E5E5E5] shadow-xl relative z-10 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5A800] mx-auto mb-4">
          <Mail className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-[#111111] mb-1">Reset Account Password</h2>
        <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
          Enter your registered email address or phone number to receive a secure recovery code.
        </p>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>
                Reset instructions sent to <strong className="text-zinc-900">{emailOrPhone}</strong>.
                Please check your inbox or SMS.
              </span>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs text-[#111111] hover:text-[#F5A800] font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Email / Phone
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="name@titanauto.com"
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              Send Reset Code
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

