import { useNavigate } from 'react-router-dom';

export default function SplashWelcomeScreen() {
  const navigate = useNavigate();

  const handleVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        'Welcome to KhetSaathi. Your smart companion for crop advisories, live mandi rates, and government schemes. Tap Get Started to begin.'
      );
      u.rate = 0.95;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe pb-safe">
      {/* Compact Top Bar */}
      <div className="w-full px-margin pt-2">
        <div className="flex items-center justify-between h-14 w-full">
          <div className="flex items-center gap-space-xs bg-surface-container-low px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Synced · Offline Ready</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Listen to screen info"
              onClick={handleVoice}
              className="w-9 h-9 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-sm active:scale-95 transition-transform"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
            </button>
            <button className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full text-on-surface font-label-md text-label-md shadow-sm active:scale-95 transition-transform" type="button">
              <span>English</span>
              <span className="material-symbols-outlined text-[18px] text-outline">expand_more</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex flex-col px-margin gap-space-md flex-1">
        {/* Hero Card */}
        <div className="relative w-full rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg mt-space-sm flex flex-col items-center text-center overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary-fixed/20 pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-secondary-fixed/30 pointer-events-none"></div>

          {/* Logo */}
          <div className="relative mb-space-md">
            <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center p-2 shadow-inner">
              <img
                alt="KhetSaathi Emblem"
                className="w-20 h-20 object-contain rounded-full"
                src="https://lh3.googleusercontent.com/aida/AEtjO1UIQkciQWmlsTRY8f9Zy0F8V6Ui5SnL-bNI1XODjLR9sQNG4BHGAMrtvwAK-8Il7hBixSfzotAqt-1yzxZ1tS8lfeStHMZMcAAazASvjFxGLljEzJwhmT37IQLEv0u0wChglbOYjrW80Tbxp2N5Gci7RSN8sqPVnTp66_kG_QHJe8HBtzy0s7YivFGLy5OK6W6ahvWh_DtV3OjnAKUT1Zgj0Ae4r9TLabB2OQOypc-WO4bS3YHevJEUIf8"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
              <span className="material-symbols-outlined text-[16px]">verified</span>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant mb-space-xs">
            <span className="material-symbols-outlined text-[16px]">spa</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Farmer's Trust Network</span>
          </div>

          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">KhetSaathi</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs max-w-[280px]">
            Your smart companion for better harvest, fair prices, and direct farm support.
          </p>

          {/* Field Hero Image */}
          <div className="w-full mt-space-md rounded-xl overflow-hidden shadow-sm relative h-32 bg-surface-container">
            <img
              className="w-full h-full object-cover"
              alt="Vibrant golden wheat field"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDK7NVGkjzh5BQXmoyfJrI8UUIEXPLGyQanvMIPmW-gJUU9AoXzXgyG-S5-gmK0mg8wP_YVJ4qrhzlz35nQPD61JKTGKJ9y484bURcIjTmyjOvbeFfP855STHVQ8LRuBzXaf2wZh5alnk-j4oCTWhZYMBFPswUzfWxC7A04RirvKH6A3av-_xYkSJElibpYLGAm_6K5h0P1bR9bnA_L6SO-S-9WTWNLLrzTvTSJZu503EPI9zFkP1nR"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-space-sm">
              <span className="font-label-sm text-label-sm text-on-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary-fixed">wb_sunny</span>
                Trusted by 45,000+ kisan families
              </span>
            </div>
          </div>
        </div>

        {/* Feature List */}
        <div className="flex flex-col gap-space-sm">
          {[
            { icon: 'eco', color: 'bg-primary-fixed/40 text-primary', title: 'Crop Health & Advisories', sub: 'Instant diagnosis via photo & season alerts' },
            { icon: 'monitoring', color: 'bg-secondary-fixed text-secondary', title: 'Live Mandi Market Prices', sub: 'Daily updated rates from nearby APMCs' },
            { icon: 'account_balance', color: 'bg-tertiary-fixed text-tertiary', title: 'Direct Government Schemes', sub: 'Subsidy guides & PM-Kisan status tracker' },
          ].map(({ icon, color, title, sub }) => (
            <div key={title} className="flex items-center gap-space-md p-space-md rounded-xl bg-surface-container-lowest shadow-sm active:bg-surface-container-low transition-colors">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-[26px]">{icon}</span>
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">{title}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{sub}</span>
              </div>
              <span className="material-symbols-outlined text-outline ml-auto">chevron_right</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-space-lg flex flex-col gap-space-sm pt-space-xs pb-8">
          <button
            onClick={() => navigate('/onboarding/phone')}
            className="w-full h-14 bg-primary text-on-primary rounded-xl font-label-lg text-label-lg shadow-md flex items-center justify-center gap-space-xs active:scale-[0.98] transition-transform"
            type="button"
          >
            <span>Get Started</span>
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 text-center text-primary font-label-md text-label-md active:opacity-75 transition-opacity"
            type="button"
          >
            I already have an account ·{' '}
            <span className="underline underline-offset-4 font-bold">Log in</span>
          </button>
        </div>
      </main>
    </div>
  );
}
