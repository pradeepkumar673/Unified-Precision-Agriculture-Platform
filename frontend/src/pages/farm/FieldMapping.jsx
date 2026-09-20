import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveFarmBoundary } from '../../api/farmApi';

export default function FieldMapping() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');
  const [mode, setMode] = useState('walk'); // 'walk' | 'tap'
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [saving, setSaving] = useState(false);
  // Simulated live survey state (in real app this drives GPS polygon)
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPaused) setElapsed(t => t + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isPaused]);

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}m ${sec}s`;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await saveFarmBoundary(farmId, {
        type: 'Polygon',
        coordinates: [], // Real implementation: captured GPS waypoints
        area_acres: 4.52,
      });
      navigate('/farm/profile');
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe pb-safe">
      {/* Fixed header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full active:bg-surface-container" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant">GPS Boundary Survey</span>
              <span className="font-headline-sm text-headline-sm text-on-surface truncate">Field Boundary Mapping</span>
            </div>
          </div>
          <button aria-label="Voice assist" className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-primary active:bg-surface-container-high" type="button">
            <span className="material-symbols-outlined text-[20px]">record_voice_over</span>
          </button>
        </div>
      </header>

      <main className="flex flex-col w-full pt-20 pb-24 bg-background flex-1">
        {/* Map mock */}
        <div className="relative w-full bg-surface-container" style={{ height: '40vh' }}>
          {/* Map backdrop */}
          <img
            alt="Satellite field map"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDK7NVGkjzh5BQXmoyfJrI8UUIEXPLGyQanvMIPmW-gJUU9AoXzXgyG-S5-gmK0mg8wP_YVJ4qrhzlz35nQPD61JKTGKJ9y484bURcIjTmyjOvbeFfP855STHVQ8LRuBzXaf2wZh5alnk-j4oCTWhZYMBFPswUzfWxC7A04RirvKH6A3av-_xYkSJElibpYLGAm_6K5h0P1bR9bnA_L6SO-S-9WTWNLLrzTvTSJZu503EPI9zFkP1nR"
            className="w-full h-full object-cover opacity-50"
          />

          {/* Mode toggle */}
          <div className="absolute top-3 left-3 bg-surface rounded-xl shadow-md p-1 flex gap-1">
            <button
              onClick={() => setMode('walk')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${mode === 'walk' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">directions_walk</span>
              <span className="font-label-md text-label-md">Walk</span>
            </button>
            <button
              onClick={() => setMode('tap')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${mode === 'tap' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">touch_app</span>
              <span className="font-label-md text-label-md">Tap</span>
            </button>
          </div>

          {/* Live label */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-surface/90 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-sm text-label-sm font-semibold text-on-surface">Khasra 219/14 · Kharif</span>
          </div>

          {/* Right toolbar */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {[
              { icon: 'navigation', label: 'Reset North', color: 'text-primary' },
              { icon: 'layers', label: 'Toggle Satellite layer', color: 'text-on-surface' },
              { icon: 'my_location', label: 'Recenter on Farmer Location', color: 'text-primary' },
              { icon: 'undo', label: 'Undo last surveyed point', color: 'text-secondary' },
            ].map(({ icon, label, color }) => (
              <button key={icon} aria-label={label} className={`w-10 h-10 rounded-xl bg-surface shadow-md flex items-center justify-center ${color} active:scale-95 transition-transform`}>
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </button>
            ))}
          </div>

          {/* Voice toast */}
          <div className="absolute bottom-3 left-3 right-3 bg-surface/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-md flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-tertiary text-[16px]">record_voice_over</span>
            </div>
            <p className="font-body-sm text-[13px] text-on-surface leading-tight truncate">
              "Continue along the canal bund. Turn right at the corner neem tree."
            </p>
          </div>
        </div>

        {/* Telemetry card */}
        <section className="px-margin -mt-2 z-10">
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <span className="font-label-md text-label-md text-on-surface font-bold">Surveying Plot 1 Boundary</span>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span className="font-label-sm text-label-sm font-semibold">99.4% Loop Fit</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1 pt-1">
              <div>
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">4.52</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold ml-1">Acres</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium bg-surface-container px-2.5 py-1 rounded-md">≈ 1.83 Hectares</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 bg-surface-container-low p-2.5 rounded-xl">
              {[
                { icon: 'straighten', label: 'Perimeter', value: '912 m' },
                { icon: 'pin_drop', label: 'Waypoints', value: '14 Points' },
                { icon: 'speed', label: 'Walk Speed', value: '3.2 km/h' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">{icon}</span> {label}
                  </span>
                  <span className="font-label-lg text-label-lg font-bold text-on-surface mt-0.5">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timer row */}
        <section className="px-margin mt-space-sm">
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">timer</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Active Elapsed Time</p>
                <p className="font-label-md text-label-md text-on-surface font-semibold">{formatElapsed(elapsed)} · {isPaused ? 'Paused' : 'Smooth tracking'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsPaused(p => !p)}
              className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-label-sm font-semibold active:bg-surface-variant flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">{isPaused ? 'play_arrow' : 'pause'}</span>
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          </div>
        </section>

        {/* Bottom action dock */}
        <footer className="mt-space-md px-margin flex flex-col gap-space-xs pb-space-sm">
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full h-14 bg-secondary-container text-on-secondary rounded-xl font-label-lg text-label-lg font-bold shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <><span className="w-5 h-5 rounded-full border-2 border-on-secondary border-t-transparent animate-spin"></span><span>Saving...</span></>
            ) : (
              <><span>Finish &amp; Save Boundary (4.52 Ac)</span><span className="material-symbols-outlined text-[22px]">arrow_forward</span></>
            )}
          </button>
          <div className="flex items-center justify-between gap-2 mt-1">
            <button className="flex-1 py-3 text-center rounded-xl bg-surface-container text-on-surface font-label-md text-label-md font-semibold active:bg-surface-variant" type="button">
              Add Manual Corner
            </button>
            <button className="flex-1 py-3 text-center rounded-xl bg-surface-container text-error font-label-md text-label-md font-semibold active:bg-surface-variant" type="button">
              Discard &amp; Restart
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
