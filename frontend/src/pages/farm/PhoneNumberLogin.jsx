import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/farmApi';
import { useAuth } from '../../App';

export default function PhoneNumberLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef(null);
  const otpInputRef = useRef(null);

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    let formatted = digits;
    if (digits.length > 5) formatted = digits.slice(0, 5) + ' ' + digits.slice(5);
    setPhone(formatted);
    setIsValid(digits.length === 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 2) return handleOtpSubmit(e);
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError(true);
      setTimeout(() => setError(false), 700);
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone: `+91${digits}` });
      setSent(true);
      setTimeout(() => {
        setStep(2);
        setLoading(false);
        setSent(false);
        setTimeout(() => otpInputRef.current?.focus(), 100);
      }, 1000);
    } catch {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) {
      setOtpError(true);
      setTimeout(() => setOtpError(false), 700);
      return;
    }
    setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '');
      const res = await api.post('/auth/verify-otp', { phone: `+91${digits}`, otp });
      // Fix: Ensure we save the user's primary farm ID so the app loads correctly
      if (res.data.farms && res.data.farms.length > 0) {
        localStorage.setItem('farmId', res.data.farms[0].id);
        localStorage.setItem('activeFarmId', res.data.farms[0].id);
      }
      
      login(res.data.access_token);
      
      if (res.data.is_new_user) {
        navigate('/onboarding/role');
      } else {
        navigate('/');
      }
    } catch (err) {
      setOtpError(true);
      setLoading(false);
      setTimeout(() => setOtpError(false), 1500);
    }
  };

  const handleVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        'Please enter your 10 digit mobile number to receive a one-time verification password.'
      );
      u.rate = 0.9;
      u.lang = 'en-IN';
      window.speechSynthesis.speak(u);
    }
  };

  const rawDigits = phone.replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe pb-safe">
      {/* Header */}
      <header className="w-full px-margin pt-2">
        <div className="flex items-center justify-between h-14 w-full">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full active:bg-surface-container" type="button">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container text-on-surface font-label-md text-label-md"
            type="button"
          >
            <span className="material-symbols-outlined text-body-md" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
            <span className="font-label-md text-label-md">English</span>
            <span className="material-symbols-outlined text-label-md text-outline">expand_more</span>
          </button>
        </div>
      </header>

      <main className="flex flex-col px-margin gap-space-md flex-1">
        {/* Brand Mark */}
        <div className="flex items-center gap-3 mb-space-lg bg-surface-container-low p-space-md rounded-xl">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-on-primary shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined text-headline-md">spa</span>
          </div>
          <div className="min-w-0">
            <p className="font-label-lg text-label-lg text-primary leading-tight">KhetSaathi</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Your Digital Krishi Mitra</p>
          </div>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-space-xs mb-space-lg">
          <div className="flex items-start justify-between gap-space-sm">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {step === 1 ? 'Enter your mobile number' : 'Enter OTP'}
            </h1>
            <button
              aria-label="Listen instructions in English"
              onClick={handleVoice}
              className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-tertiary-fixed text-on-tertiary-fixed active:bg-tertiary active:text-on-tertiary shadow-sm transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-headline-sm">record_voice_over</span>
            </button>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {step === 1 
              ? 'We will send a 6-digit verification code (OTP) via SMS to verify your account.'
              : `Enter the 6-digit code sent to +91 ${phone}`}
          </p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-space-lg" onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="flex flex-col gap-space-xs">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1.5" htmlFor="mobileNumber">
                <span className="material-symbols-outlined text-label-md text-primary">smartphone</span>
                Mobile Phone Number
              </label>

              {/* Input shell */}
              <div
                className={`flex items-stretch h-16 w-full rounded-xl shadow-sm transition-all overflow-hidden focus-within:ring-2 focus-within:ring-primary-container ${error ? 'bg-error-container' : 'bg-surface-container-lowest'}`}
              >
                {/* India flag + code */}
                <div className="flex items-center gap-2 px-3.5 bg-surface-container-high flex-shrink-0 select-none">
                  <div className="flex flex-col w-6 h-4 rounded overflow-hidden shadow-xs border-none justify-between">
                    <span className="w-full h-1.5 bg-[#FF9933]"></span>
                    <span className="w-full h-1 bg-surface-container-lowest flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-tertiary"></span>
                    </span>
                    <span className="w-full h-1.5 bg-[#138808]"></span>
                  </div>
                  <span className="font-label-lg text-label-lg text-on-surface tracking-wide">+91</span>
                  <span className="w-px h-6 bg-outline-variant ml-1"></span>
                </div>

                {/* Input */}
                <input
                  ref={inputRef}
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={11}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => formatPhone(e.target.value)}
                  className="flex-1 bg-transparent px-space-md text-headline-sm font-headline-sm text-on-surface placeholder:text-outline tracking-wider focus:outline-none"
                />

                {/* Validation check */}
                {isValid && (
                  <div className="flex items-center pr-space-md text-primary-container">
                    <span className="material-symbols-outlined text-headline-sm">check_circle</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-label-sm text-secondary">key_off</span>
                  No password needed. Simple OTP login.
                </span>
                <span className="font-label-sm text-label-sm text-outline">{rawDigits.length}/10</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-space-xs">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1.5" htmlFor="otpCode">
                <span className="material-symbols-outlined text-label-md text-primary">pin</span>
                Verification Code
              </label>

              <div
                className={`flex items-center h-16 w-full rounded-xl shadow-sm transition-all overflow-hidden focus-within:ring-2 focus-within:ring-primary-container ${otpError ? 'bg-error-container' : 'bg-surface-container-lowest'}`}
              >
                <input
                  ref={otpInputRef}
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-full bg-transparent px-space-md text-center text-headline-md font-headline-md tracking-[1em] text-on-surface placeholder:text-outline focus:outline-none"
                />
              </div>
              <div className="flex justify-center mt-2">
                <span className="font-label-sm text-label-sm text-primary cursor-pointer hover:underline" onClick={() => setStep(1)}>
                  Wrong number? Change it
                </span>
              </div>
            </div>
          )}

          {/* Reassurance */}
          <div className="flex items-start gap-3 p-space-md rounded-xl bg-surface-container">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-body-md" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">Secure & Low-Data Friendly</span>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Your data is private and securely encrypted. Works reliably even on 2G rural networks.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (step === 1 && sent)}
            className={`flex items-center justify-center gap-2 w-full h-14 rounded-xl font-label-lg text-label-lg text-on-primary shadow-md active:opacity-90 active:scale-[0.99] transition-all ${sent ? 'bg-primary-container' : (step === 1 ? isValid : otp.length === 6) ? 'bg-secondary' : 'bg-secondary-container'}`}
          >
            {sent ? (
              <>
                <span className="material-symbols-outlined text-headline-sm">check</span>
                <span>OTP Dispatched!</span>
              </>
            ) : loading ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin inline-block"></span>
                <span>{step === 1 ? 'Sending OTP SMS...' : 'Verifying...'}</span>
              </>
            ) : (
              <>
                <span>{step === 1 ? 'Get OTP Code' : 'Verify & Login'}</span>
                <span className="material-symbols-outlined text-headline-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footnote */}
        <div className="mt-space-xl flex flex-col items-center text-center gap-2 pb-8">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high">
            <span className="material-symbols-outlined text-body-sm text-secondary">support_agent</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Need assistance logging in?</span>
          </div>
          <a className="flex items-center gap-2 text-primary font-label-lg text-label-lg active:underline py-1" href="tel:18001801551">
            <span className="material-symbols-outlined text-body-md">call</span>
            <span>Call Toll-Free Kisan Helpline 1800-180-1551</span>
          </a>
          <p className="font-label-sm text-label-sm text-outline">Free government service available 6 AM - 10 PM</p>
        </div>
      </main>
    </div>
  );
}
