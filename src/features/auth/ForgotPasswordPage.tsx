import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Lock, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth.service';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || searchParams.get('emailOrPhone') || '';
  const [step, setStep] = useState<1 | 2>(1);
  const [emailOrPhone, setEmailOrPhone] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setErrorMsg('Please enter your email or phone number.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const res: any = await authService.forgotPassword(emailOrPhone.trim());
      const payload = res?.data || res;
      setIsSimulated(payload?.simulated ?? false);
      setSuccessMsg(payload?.message || 'Verification code dispatched if account exists.');
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to dispatch reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otp.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      setErrorMsg('Password must contain at least one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        emailOrPhone: emailOrPhone.trim(),
        otp: otp.trim(),
        password,
      });

      setSuccessMsg('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate(`/login?email=${encodeURIComponent(emailOrPhone.trim())}`);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
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
          <KeyRound className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-[#111111] mb-1">
          {step === 1 ? 'Reset Account Password' : 'Enter Verification Code'}
        </h2>
        <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
          {step === 1
            ? 'Enter your registered email address or phone number to receive a secure recovery code.'
            : `Enter the 6-digit code sent to ${emailOrPhone} and set your new password.`}
        </p>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 mb-4 text-left">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2 mb-4 text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 2 && isSimulated && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-start gap-2.5 mb-4 text-left">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-amber-950">Development / Mock Mode Active</span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Outbound SMTP delivery is not configured on this server (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">SMTP_HOST</code> is empty). A verification code was generated on the server for security testing, but no email was transmitted to external inboxes.
              </p>
            </div>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-4 text-left">
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
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Send Reset Code'}
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
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                6-Digit Verification Code
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 583921"
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold tracking-widest text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full h-10 pl-9 pr-10 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="hover:text-zinc-900 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Email/Phone
              </button>
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={loading}
                className="font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50"
              >
                Resend Code
              </button>
              <Link to="/login" className="hover:text-zinc-900">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
