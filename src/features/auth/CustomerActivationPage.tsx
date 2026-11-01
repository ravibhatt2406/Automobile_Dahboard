import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, KeyRound, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth.service';

export const CustomerActivationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const otpParam = searchParams.get('otp') || '';
  const emailParam = searchParams.get('email') || searchParams.get('emailOrPhone') || '';

  const [emailOrPhone, setEmailOrPhone] = useState(emailParam);
  const [otp, setOtp] = useState(otpParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    if (emailParam && !emailOrPhone) setEmailOrPhone(emailParam);
    if (otpParam && !otp) setOtp(otpParam);
  }, [emailParam, otpParam]);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pass)) return 'Password must include at least one uppercase letter.';
    if (!/[a-z]/.test(pass)) return 'Password must include at least one lowercase letter.';
    if (!/[0-9]/.test(pass)) return 'Password must include at least one number.';
    return null;
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!tokenParam && !emailOrPhone.trim()) {
      setErrorMsg('Please enter your email or phone number.');
      return;
    }

    if (!tokenParam && !otp.trim()) {
      setErrorMsg('Please enter the 6-digit activation code sent to you.');
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setErrorMsg(passError);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.activateCustomer({
        token: tokenParam || undefined,
        otp: otp.trim() || undefined,
        emailOrPhone: emailOrPhone.trim() || undefined,
        password,
      });

      setIsActivated(true);
      setSuccessMsg('Your customer account has been successfully activated! Logging you in...');
      setTimeout(() => {
        navigate('/customer/dashboard');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Activation failed. Please check your verification code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailOrPhone.trim()) {
      setErrorMsg('Please enter your email or phone number above to resend code.');
      return;
    }
    setErrorMsg(null);
    setResending(true);
    try {
      const res = await authService.resendCustomerActivation(emailOrPhone.trim());
      setSuccessMsg(res?.message || 'A new verification code has been dispatched.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not resend activation code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-[#E5E5E5] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
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
                <ShieldCheck className="w-3 h-3" /> SECURE ACTIVATION
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight">
                Activate Your Client Account
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Welcome to Titan Auto commercial fleet portal. Verify your account invitation and establish your secure password.
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800]" /> 100% Secure Self-Serve Password Setup
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800]" /> Direct Access to Quotations & Fleet Ledger
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800]" /> Encrypted Identity Verification
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <Link to="/login/customer" className="text-zinc-400 hover:text-white transition-colors">
              ← Already activated? Log In
            </Link>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full space-y-6">
            <div>
              <span className="text-[10px] font-bold text-[#F5A800] uppercase tracking-widest font-mono block">
                ONE-TIME VERIFICATION
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#111111] mt-1">
                Account Activation
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                {tokenParam
                  ? 'Your invitation token is verified. Set your account password below.'
                  : 'Enter the code sent to your email/phone and create your login password.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {isActivated ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-3"
              >
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Account Ready!</h3>
                <p className="text-xs text-zinc-500">Redirecting to your commercial fleet dashboard...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleActivate} className="space-y-4">
                {!tokenParam && (
                  <>
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
                          placeholder="corporate@company.com"
                          className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                          6-Digit Verification Code / OTP
                        </label>
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resending}
                          className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                          {resending ? 'Resending...' : 'Resend Code'}
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 583921"
                          className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold tracking-widest text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Set New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars, uppercase, number"
                      className="w-full h-10 pl-9 pr-10 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
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
                      placeholder="Re-enter your password"
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {isSubmitting ? (
                    <span>Activating Account...</span>
                  ) : (
                    <>
                      <span>Activate & Set Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-[#E5E5E5] text-center text-xs text-zinc-600">
              Need assistance? Contact your Titan Auto dealership branch representative.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
