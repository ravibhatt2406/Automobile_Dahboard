import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, KeyRound, RefreshCw, Eye, EyeOff, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth.service';

export const EmployeeActivationPage: React.FC = () => {
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
      setErrorMsg('Please enter your employee email or phone number.');
      return;
    }

    if (!tokenParam && !otp.trim()) {
      setErrorMsg('Please enter the 6-digit activation code sent to your email or SMS.');
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
      await authService.activateEmployee({
        token: tokenParam || undefined,
        otp: otp.trim() || undefined,
        emailOrPhone: emailOrPhone.trim() || undefined,
        password,
      });

      setIsActivated(true);
      setSuccessMsg('Your employee credentials have been established successfully! Redirecting...');
      setTimeout(() => {
        navigate('/login/organization');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Activation failed. Please check your verification code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailOrPhone.trim()) {
      setErrorMsg('Please enter your email or phone number above to resend activation code.');
      return;
    }
    setErrorMsg(null);
    setResending(true);
    try {
      const res = await authService.resendEmployeeActivation(emailOrPhone.trim());
      setSuccessMsg(res?.message || 'A new verification invitation has been dispatched.');
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest font-mono">
                <Building className="w-3.5 h-3.5" /> ENTERPRISE PERSONNEL
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight">
                Establish Your Employee Account Password
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Welcome to the Titan Auto dealership network. Complete your identity verification and set your private credentials to access dealership operations.
              </p>
            </div>

            <div className="pt-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800] shrink-0" /> Zero shared administrator passwords
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800] shrink-0" /> End-to-end encrypted credential setup
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A800] shrink-0" /> Multi-branch permissions configured automatically
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <Link to="/login/organization" className="text-zinc-400 hover:text-white transition-colors">
              ← Return to Employee Login
            </Link>
          </div>
        </div>

        {/* Right Side: Activation Form */}
        <div className="md:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <span className="text-[10px] font-bold text-[#F5A800] uppercase tracking-widest font-mono block">
                EMPLOYEE ONBOARDING
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#111111] mt-1">
                Activate Employee Account
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                {tokenParam
                  ? 'Your invitation token is verified. Please establish your confidential password below.'
                  : 'Enter the 6-digit activation code sent to your email or mobile phone.'}
              </p>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="flex-1">{successMsg}</div>
              </motion.div>
            )}

            {!isActivated && (
              <form onSubmit={handleActivate} className="space-y-4">
                {!tokenParam && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                        Employee Email or Phone
                      </label>
                      <div className="relative flex items-center">
                        <Mail className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          value={emailOrPhone}
                          onChange={(e) => setEmailOrPhone(e.target.value)}
                          placeholder="employee@titanauto.com"
                          className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                          6-Digit Verification Code
                        </label>
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resending}
                          className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                          Resend Code
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="123456"
                          className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 font-mono text-sm tracking-widest text-zinc-900 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Create Confidential Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters (1 upper, 1 lower, 1 digit)"
                      className="w-full h-10 pl-9 pr-10 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
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
                    Confirm Confidential Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-[#111111] hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Activate & Establish Credentials</span>
                      <ArrowRight className="w-4 h-4 text-[#F5A800]" />
                    </>
                  )}
                </button>
              </form>
            )}

            {isActivated && (
              <div className="text-center pt-4">
                <Link
                  to="/login/organization"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-white font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                >
                  <span>Go to Employee Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#F5A800]" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
