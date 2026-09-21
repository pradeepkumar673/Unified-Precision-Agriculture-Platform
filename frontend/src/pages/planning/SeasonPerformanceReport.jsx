import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCropPlan } from '../../api/planningApi';

const COMPARISON_METRICS = [
  {
    label: 'Yield Output',
    thisYear: '21.4 Qtl/Ac',
    delta: '+22.3%',
    lastW: '68%',
    lastLabel: '17.5 Qtl',
    thisW: '88%',
    thisLabel: '21.4 Qtl',
    thisLabelColor: 'text-primary',
  },
  {
    label: 'Input Cost / Acre',
    thisYear: '₹1,16,933',
    delta: '-14.5%',
    lastW: '84%',
    lastLabel: '₹119.8k',
    lastLabelColor: 'text-secondary',
    thisW: '71%',
    thisLabel: '₹116.9k',
    thisLabelColor: 'text-primary',
    lastBarColor: 'bg-secondary-fixed-dim',
  },
  {
    label: 'Net Realized Profit / Acre',
    thisYear: '₹1,42,142',
    delta: '+31.3%',
    lastW: '62%',
    lastLabel: '₹132.1k',
    thisW: '92%',
    thisLabel: '₹142.1k',
    thisLabelColor: 'text-primary',
  },
];

export default function SeasonPerformanceReport() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');
  const [report, setReport] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!farmId) return;
    getCropPlan(farmId).then(r => setReport(r.data)).catch(() => {});
  }, [farmId]);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloaded(true);
      setDownloading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed header */}
      

      <main className="flex flex-col w-full pt-20 pb-36 px-margin bg-background flex-1 space-y-space-lg">
        {/* Hero Yield Strip */}
        <section className="mt-4 bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
          <div className="flex items-center justify-between mb-space-sm">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Final Harvest Yield</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">21.4 Qtl/Ac</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-bold">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>+22.3%
                </span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">vs 17.5 Qtl/Ac last Rabi · District avg: 19.2 Qtl/Ac</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary-fixed/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[28px]">grain</span>
            </div>
          </div>
          {/* Mini metrics */}
          <div className="grid grid-cols-3 gap-space-sm pt-space-sm border-t border-surface-container-high">
            {[
              { icon: 'payments', iconColor: 'text-primary', label: 'Net Profit/Ac', value: '₹1,42,142', badge: null },
              { icon: 'water_drop', iconColor: 'text-tertiary', label: 'Water Saved', value: '24%', badge: 'bg-tertiary-fixed text-on-tertiary-fixed' },
              { icon: 'star', iconColor: 'text-secondary-container', label: 'AI Accuracy', value: '91.2%', badge: null },
            ].map(({ icon, iconColor, label, value, badge }) => (
              <div key={label} className="flex flex-col items-center text-center">
                <span className={`material-symbols-outlined text-[22px] ${iconColor}`}>{icon}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{label}</span>
                <span className="font-label-lg text-label-lg text-on-surface font-bold">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Season-over-Season Comparison */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
          <div className="space-y-space-xs">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Season-over-Season Comparison</h2>
            <p className="font-label-md text-label-md text-on-surface-variant">Rabi 2023-24 (Traditional) vs Rabi 2024-25 (KhetSaathi AI)</p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-space-md pb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-surface-dim inline-block"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Last Year</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">This Season (AI)</span>
            </div>
          </div>
          {/* Bars */}
          <div className="space-y-space-md">
            {COMPARISON_METRICS.map(({ label, thisYear, delta, lastW, lastLabel, lastLabelColor, lastBarColor, thisW, thisLabel, thisLabelColor }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between font-label-md text-label-md text-on-surface font-semibold">
                  <span>{label}</span>
                  <span className="text-primary font-bold">{thisYear} ({delta})</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-16 font-label-sm text-label-sm text-right ${lastLabelColor || 'text-outline'}`}>{lastLabel}</span>
                    <div className="flex-1 bg-surface-container rounded-full h-4 overflow-hidden">
                      <div className={`${lastBarColor || 'bg-surface-dim'} h-full rounded-full`} style={{ width: lastW }}></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-16 font-label-sm text-label-sm font-bold text-right ${thisLabelColor || 'text-primary'}`}>{thisLabel}</span>
                    <div className="flex-1 bg-surface-container rounded-full h-4 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: thisW }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Insight */}
          <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-secondary-container text-[20px] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            <p className="font-body-sm text-body-sm text-on-surface">
              <strong className="text-on-surface font-semibold">Key Driver:</strong> Precision irrigation intervals and proactive yellow rust advisories averted 2 unneeded chemical sprays and protected an estimated 15% crop canopy.
            </p>
          </div>
        </section>

        {/* Certification & KCC */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
          <div className="flex items-start gap-space-sm">
            <div className="w-12 h-12 rounded-xl bg-primary-container/15 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">ICAR &amp; Mandi Certified</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Digitally signed crop ledger improves your Kisan Credit Card (KCC) renewal eligibility.</p>
            </div>
          </div>
          <div className="p-space-md rounded-lg bg-surface-container flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">KCC Credit Score Readiness</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-headline-md text-headline-md text-on-surface">810</span>
                <span className="font-label-sm text-label-sm text-primary font-bold">+45 pts (Was 765)</span>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md font-bold">Tier-1 Fast Track</div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJ2eVJgkn_FGGQOEkWsP9umpOSwlpAUhCxxXB8niMhRv3DzuXCbAB6KqHhmTp91TAqw-2zpqOdZiLwXn_wPvlvLUEvWFa9z8RaTmXaxBudMbSR2iKnCJCJ0pttS9BC1Y_l4VYzBrXjLBJ7Fhi5HEVjSPh6gbbHDuyuvsnDl3FeHnic1uu4K0wvDOpW2NkcWmcUkudBxhYGKn0bevegztV4DAMOqk6zEuGsxc62aKX3bDl3Jbv9A42g"
                alt="APMC stamp"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">Sehore APMC Mandi Receipt Attached</span>
                <span className="font-label-sm text-label-sm text-outline">Gate Pass #APMC-78912-B</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-[20px]">task_alt</span>
          </div>
        </section>
      </main>

      {/* Sticky bottom action bar */}
      <div className="sticky bottom-20 left-0 right-0 p-margin bg-surface-container-lowest shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-40 space-y-space-xs max-w-md mx-auto">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full h-14 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:opacity-95 transition-opacity"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">download</span>
          <span>{downloaded ? 'Downloaded Successfully ✓' : downloading ? 'Downloading PDF...' : 'Download PDF Report'}</span>
        </button>
        <button
          onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
          className="w-full h-12 rounded-lg bg-surface-container text-primary font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
          <span>Share Report with FPO / Bank</span>
        </button>
      </div>
    </div>
  );
}
