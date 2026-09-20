import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/farmApi';

const ROLES = [
  {
    key: 'Farmer',
    icon: 'grass',
    label: 'Farmer',
    description: 'I own or cultivate land and want crop advisory, irrigation alerts, and mandi sales.',
  },
  {
    key: 'Buyer',
    icon: 'storefront',
    label: 'Buyer',
    description: 'I purchase produce directly from farmers and wholesale mandis.',
  },
  {
    key: 'Agent',
    icon: 'groups',
    label: 'Agent / FPO',
    description: 'I assist farmer groups with supplies, equipment rental, and collective sales.',
  },
  {
    key: 'Lender',
    icon: 'account_balance',
    label: 'Agri Lender',
    description: 'I provide credit lines, crop insurance, and financial verification for farmers.',
  },
];

export default function RoleSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('Farmer');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      await api.post('/auth/set-role', { role: selected });
      navigate('/onboarding/farm-setup');
    } catch {
      setLoading(false);
    }
  };

  const handleVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('Choose your primary role. Farmer, Buyer, Agent, or Lender. Tap to select.');
      u.lang = 'en-IN';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe pb-safe">
      {/* Header */}
      <header className="w-full px-margin pt-2">
        <div className="flex items-center justify-between h-14 w-full">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full active:bg-surface-container" type="button">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <button
            onClick={handleVoice}
            aria-label="Voice help"
            className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-sm active:scale-95 transition-transform"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
          </button>
        </div>
      </header>

      <main className="flex flex-col px-margin flex-1">
        {/* Headline */}
        <div className="flex flex-col gap-space-xs mb-space-lg mt-2">
          <div className="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-surface-container-high w-fit">
            <span className="font-label-sm text-label-sm text-outline">Step 2 of 3</span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Choose your primary role</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            This customises your KhetSaathi experience. You can hold multiple roles.
          </p>
        </div>

        {/* Role cards */}
        <div className="flex flex-col gap-space-sm">
          {ROLES.map(({ key, icon, label, description }) => {
            const isSelected = selected === key;
            return (
              <button
                key={key}
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(key)}
                className={`relative flex items-start gap-space-md p-space-md rounded-xl shadow-sm transition-all cursor-pointer text-left w-full ${
                  isSelected ? 'bg-primary-fixed/20' : 'bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
                type="button"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container text-primary'
                }`}>
                  <span className="material-symbols-outlined text-[26px]">{icon}</span>
                </div>
                <div className="flex-1 min-w-0 pr-space-lg">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{label}</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{description}</p>
                </div>
                {/* Radio indicator */}
                <div className={`absolute top-space-md right-space-md w-6 h-6 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-high'
                }`}>
                  <span className={`material-symbols-outlined text-[16px] font-bold ${isSelected ? '' : 'opacity-0'}`}>check</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Reassurance banner */}
        <div className="mt-space-lg p-space-md rounded-xl bg-surface-container-low flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary text-[22px]">verified_user</span>
          </div>
          <div className="flex-1">
            <p className="font-label-md text-label-md text-on-surface font-bold">Simple Verification</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">No complex paperwork needed to get started.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-space-xl flex flex-col items-center gap-space-sm pb-8">
          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full h-14 rounded-xl bg-secondary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-space-xs shadow-md active:opacity-95 transition-all"
            type="button"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
            ) : (
              <>
                <span>Continue as {selected}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
          <p className="font-label-sm text-label-sm text-on-surface-variant text-center flex items-center gap-1 justify-center">
            <span className="material-symbols-outlined text-[15px] text-outline">info</span>
            You can update or add roles later in settings.
          </p>
        </div>
      </main>
    </div>
  );
}
