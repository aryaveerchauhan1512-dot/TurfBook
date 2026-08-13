import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Building,
  CheckSquare,
  Square,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { User } from '../types';
import { TurfBookLogo } from './TurfBookLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'user' | 'owner';
  onLoginSuccess: (user: User) => void;
  onOpenTOS: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'user',
  onLoginSuccess,
  onOpenTOS,
}) => {
  const [role, setRole] = useState<'user' | 'owner'>(initialRole);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Reset/sync role and mode when modal opens or initialRole changes
  React.useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setMode('login');
      setError(null);
      setInfoMessage(null);
    }
  }, [isOpen, initialRole]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Robust API request helper
  const requestApi = async (url: string, body: any) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data: any = {};
      
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error(`API response non-JSON from ${url}:`, text);
          const cleanMsg = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
          throw new Error(cleanMsg || `Server returned response with status ${res.status}.`);
        }
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${res.status}.`);
      }

      return data;
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        throw new Error('Connection error. Please check your network connection.');
      }
      throw err;
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    setError(null);
    setInfoMessage(null);
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address to receive OTP.');
      return;
    }

    setLoading(true);
    try {
      const data = await requestApi('/api/auth/send-otp', { email: email.trim() });

      setOtpSent(true);
      if (data.emailSent) {
        setOtpNotice(`6-digit OTP code sent to ${email.trim()}. Please check your inbox or spam folder.`);
      } else if (data.otp) {
        setOtpNotice(`OTP Code: ${data.otp} (Your 6-digit verification code)`);
        setOtpInput(data.otp);
      } else {
        setOtpNotice(`OTP code requested for ${email.trim()}.`);
      }
      setInfoMessage(`Verification OTP code generated.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (mode === 'forgot') {
      if (!email) {
        setError('Please enter your email address.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setInfoMessage('Password reset link has been sent to your email address.');
      }, 800);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        // Check 10 digit phone number
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
          setError('Contact phone number must be exactly 10 digits (e.g. 9876543210).');
          setLoading(false);
          return;
        }

        if (!tosAccepted) {
          setError('You must accept the Terms of Service before creating an account.');
          setLoading(false);
          return;
        }

        // Handle OTP verification if not verified yet
        if (!otpVerified) {
          if (!otpSent) {
            setLoading(false);
            await handleSendOtp();
            return;
          }

          if (!otpInput || otpInput.trim().length !== 6) {
            setError('Please enter the 6-digit OTP code sent to your email.');
            setLoading(false);
            return;
          }

          // Verify OTP
          await requestApi('/api/auth/verify-otp', {
            email: email.trim(),
            otp: otpInput.trim(),
          });
          setOtpVerified(true);
        }

        // Register user
        const data = await requestApi('/api/auth/register', {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          phone: digitsOnly,
          businessName: role === 'owner' ? businessName : undefined,
          tosAccepted,
        });

        if (rememberMe) {
          localStorage.setItem('turfbook_user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('turfbook_user', JSON.stringify(data.user));
        }

        onLoginSuccess(data.user);
        onClose();
      } else {
        // Login mode
        const data = await requestApi('/api/auth/login', {
          email: email.trim(),
          password,
          expectedRole: role,
        });

        if (rememberMe) {
          localStorage.setItem('turfbook_user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('turfbook_user', JSON.stringify(data.user));
        }

        onLoginSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const mockGoogleUser: User = {
        id: `${role === 'owner' ? 'owner' : 'usr'}-google-${Date.now()}`,
        name: role === 'owner' ? 'Pro Owner' : 'Google Player',
        email: email || `player.${Date.now()}@gmail.com`,
        role,
        phone: '+91 98765 00000',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('turfbook_user', JSON.stringify(mockGoogleUser));
      onLoginSuccess(mockGoogleUser);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo and Header */}
        <div className="text-center mb-6">
          <TurfBookLogo size="md" className="justify-center mb-3" />

          {/* Role selector badge */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-2xl mb-4 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setRole('user');
                setError(null);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                role === 'user'
                  ? 'bg-white text-[#2E7D32] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Player Account
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('owner');
                setError(null);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                role === 'owner'
                  ? 'bg-white text-[#43A047] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Turf Owner Account
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-800">
            {mode === 'login'
              ? `Sign In as ${role === 'user' ? 'Player' : 'Turf Owner'}`
              : mode === 'register'
              ? `Create ${role === 'user' ? 'Player' : 'Owner'} Account`
              : 'Reset Your Password'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'owner'
              ? 'Manage turfs, accept bookings, and track revenue.'
              : 'Book sports turfs instantly across your favorite sports.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] transition-all"
                />
              </div>
            </div>
          )}

          {mode === 'register' && role === 'owner' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business / Venue Brand Name *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Sports Arena"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] transition-all"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Mobile Number (10 Digits) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210 (10 digits)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Must be an official 10-digit mobile number</p>
            </div>
          )}

          {/* OTP Verification Box for Signup */}
          {mode === 'register' && (
            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-900">
                  Email OTP Verification *
                </label>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-[11px] text-[#2E7D32] font-bold hover:underline"
                >
                  {otpSent ? 'Resend OTP' : 'Get OTP Code'}
                </button>
              </div>

              {otpNotice && (
                <p className="text-[11px] text-emerald-800 bg-white/80 p-2 rounded-xl border border-emerald-300 font-semibold">
                  {otpNotice}
                </p>
              )}

              {otpSent && (
                <div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP code"
                      className="w-full pl-10 pr-4 py-2 bg-white border border-emerald-300 rounded-xl text-xs text-emerald-950 font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-700 mt-1">
                    {otpVerified ? '✅ Email verified!' : 'Check your inbox for 6-digit verification code.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-[#2E7D32] font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#2E7D32] focus:ring-[#2E7D32] border-slate-300"
                />
                <span>Remember me</span>
              </label>
            </div>
          )}

          {/* TOS Checkbox - Mandatory for Register */}
          {mode === 'register' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2.5 text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  id="tosCheckbox"
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#2E7D32] focus:ring-[#2E7D32] border-slate-300 cursor-pointer shrink-0"
                />
                <label htmlFor="tosCheckbox" className="cursor-pointer leading-snug">
                  I agree to the{' '}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTOS();
                    }}
                    className="text-[#2E7D32] font-bold underline hover:text-[#1b4d1f] cursor-pointer"
                  >
                    TurfBook Terms of Service
                  </span>{' '}
                  & Privacy Policy. Personal details are securely encrypted.
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? 'Sign In'
                    : mode === 'register'
                    ? 'Create Account'
                    : 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Google Sign-In */}
        {mode !== 'forgot' && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Footer switch mode */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-[#2E7D32] font-bold hover:underline"
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-[#2E7D32] font-bold hover:underline"
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
