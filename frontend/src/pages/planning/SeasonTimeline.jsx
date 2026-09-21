import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCropPlan } from '../../api/planningApi';

const SEASON_CARDS = [
  {
    id: 'kharif',
    status: 'completed',
    statusLabel: 'Completed ✓',
    statusBg: 'bg-surface-container-high',
    statusColor: 'text-on-surface-variant',
    dateRange: 'Jun – Oct 2024',
    nodeColor: 'bg-surface-container-high text-on-surface-variant',
    cardBg: 'bg-surface-container',
    crop: 'Fallow / Green Manure (Dhaincha)',
    cropImg: null,
    cropNote: 'Soil rejuvenation season. Added 2.4T organic matter/Acre.',
    metrics: [
      { label: 'Organic Matter Added', value: '2.4T/Acre', color: 'text-on-surface' },
      { label: 'Soil N Boost', value: '+28 kg/Ac', color: 'text-primary' },
    ],
    nodeIcon: 'eco',
  },
  {
    id: 'rabi',
    status: 'active',
    statusLabel: '● Active Season',
    statusBg: 'bg-primary-fixed',
    statusColor: 'text-primary',
    dateRange: 'Nov 2024 – Mar 2025',
    nodeColor: 'bg-primary-container text-on-primary-container',
    cardBg: 'bg-surface-container-lowest shadow-md border border-primary-fixed/30',
    crop: 'Sharbati Gold Wheat (HD-2967)',
    cropImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDK7NVGkjzh5BQXmoyfJrI8UUIEXPLGyQanvMIPmW-gJUU9AoXzXgyG-S5-gmK0mg8wP_YVJ4qrhzlz35nQPD61JKTGKJ9y484bURcIjTmyjOvbeFfP855STHVQ8LRuBzXaf2wZh5alnk-j4oCTWhZYMBFPswUzfWxC7A04RirvKH6A3av-_xYkSJElibpYLGAm_6K5h0P1bR9bnA_L6SO-S-9WTWNLLrzTvTSJZu503EPI9zFkP1nR',
    cropVariety: 'Sown: 18 Nov 2024 at Row 22.5cm spacing',
    day: 42,
    totalDays: 120,
    progressPct: 35,
    stage: 'Flowering stage',
    sowDate: '12 Nov 2024',
    harvestDate: '15 Mar 2025',
    taskLabel: 'Irrigation scheduled in 2 days (Plot 1 moisture 38%)',
    nodeIcon: 'grain',
  },
  {
    id: 'zaid',
    status: 'upcoming',
    statusLabel: 'Upcoming · Planning Open',
    statusBg: 'bg-secondary/10',
    statusColor: 'text-secondary',
    dateRange: 'Mar – Jun 2025',
    nodeColor: 'bg-secondary-container/20 text-secondary',
    cardBg: 'bg-surface-container-lowest shadow-sm',
    crop: 'Moong Dal / Green Gram',
    cropImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8gU6EBHIbRlLB4yi0RnFKTRImMrb_Wyd2llRD-2nJQy_li-v43hLj36wA1cX97qAfam6iNdyoikC7fEZhe57sQtjQg5tGMSodneFffKFL4Mum-Ah8hB9zXLae_aVAch-1BzQh-p2dKPQiefEqEtgd3717hMyYLMuQ3_0oK0BrsQ_Mz49BL4s6Wphp2q02IoYowZ8kF5ejQc8YMKWuh4179TmRrNJj2OiK2fXY1uGsvPPSTeFpbzfv',
    cropVariety: 'Variety IPM-02-3 · Recommended',
    cropNote: '65-day short duration catch-crop before next monsoon. Prevents soil drying and weed outbreak.',
    profit: '+₹1,28,500 / Acre',
    nodeIcon: 'wb_sunny',
  },
  {
    id: 'kharif25',
    status: 'future',
    statusLabel: 'Kharif 2025 (Jun – Oct)',
    statusBg: 'bg-surface-container-highest',
    statusColor: 'text-on-surface-variant',
    dateRange: '',
    nodeColor: 'bg-surface-container-high text-on-surface-variant',
    cardBg: 'bg-surface-container shadow-sm',
    crop: 'Cotton or Maize rotation',
    cropNote: 'Suggested to break the pest cycle and optimize seasonal rainfall uptake.',
    nodeIcon: 'nest_clock_farsight_analog',
  },
];

export default function SeasonTimeline() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!farmId) return;
    getCropPlan(farmId).then(r => setPlan(r.data)).catch(() => {});
  }, [farmId]);

  const handleVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        'Season Timeline 2024 to 2025. Plot 1, 4.5 acres. Currently in Rabi season with Sharbati Gold Wheat at day 42. Immediate irrigation task due in 2 days. Zaid planning is open for Moong Dal rotation.'
      );
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed header */}
      

      <main className="flex flex-col w-full pt-20 pb-28 px-margin bg-background flex-1 space-y-0">
        {/* Timeline connector + cards */}
        <div className="relative mt-4">
          {/* Vertical line */}
          <div className="absolute left-6 top-6 bottom-0 w-0.5 bg-surface-container-high z-0"></div>

          <div className="flex flex-col space-y-space-lg">
            {SEASON_CARDS.map((card) => (
              <div key={card.id} className="relative flex items-start space-x-space-md z-10">
                {/* Node icon */}
                <div className={`w-12 h-12 rounded-full ${card.nodeColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span className="material-symbols-outlined text-[24px]">{card.nodeIcon}</span>
                </div>

                {/* Card body */}
                <div className={`flex-1 ${card.cardBg} rounded-xl p-space-md`}>
                  {/* Status + date */}
                  <div className="flex items-center justify-between mb-space-xs flex-wrap gap-1">
                    <span className={`px-space-sm py-1 ${card.statusBg} ${card.statusColor} rounded-full font-label-sm text-label-sm font-bold`}>
                      {card.statusLabel}
                    </span>
                    {card.dateRange && <span className="font-label-sm text-label-sm text-on-surface-variant">{card.dateRange}</span>}
                  </div>

                  {/* Active Rabi card */}
                  {card.id === 'rabi' && (
                    <>
                      <div className="flex items-center gap-space-sm mt-space-xs">
                        {card.cropImg && <img src={card.cropImg} alt={card.crop} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                        <div>
                          <h2 className="font-headline-sm text-headline-sm text-on-surface">{card.crop}</h2>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">{card.cropVariety}</p>
                        </div>
                      </div>
                      <div className="mt-space-md">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-label-md text-label-md text-on-surface font-semibold">Day {card.day} of {card.totalDays}</span>
                          <span className="font-label-sm text-label-sm text-secondary font-bold">{card.stage}</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${card.progressPct}%` }}></div>
                        </div>
                        <div className="flex justify-between text-on-surface-variant mt-1">
                          <span className="font-label-sm text-label-sm">Sown: {card.sowDate}</span>
                          <span className="font-label-sm text-label-sm">Harvest: {card.harvestDate}</span>
                        </div>
                      </div>
                      <div className="mt-space-md p-space-sm rounded-lg bg-secondary-container/15 flex items-start gap-space-sm">
                        <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                        <div className="flex-1">
                          <span className="font-label-sm text-label-sm font-bold text-secondary uppercase block">Immediate Task</span>
                          <p className="font-body-sm text-body-sm text-on-surface">{card.taskLabel}</p>
                        </div>
                      </div>
                      <button onClick={() => navigate('/planning/crop-plan')} className="w-full mt-space-md h-14 bg-secondary-container text-on-secondary-container font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-space-sm shadow-md active:scale-[0.98] transition-transform" type="button">
                        <span>View Rabi Advisory &amp; Tasks</span>
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </button>
                    </>
                  )}

                  {/* Zaid upcoming card */}
                  {card.id === 'zaid' && (
                    <>
                      <div className="flex items-center gap-space-sm mt-space-xs">
                        {card.cropImg && <img src={card.cropImg} alt={card.crop} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                        <div>
                          <h2 className="font-headline-sm text-headline-sm text-on-surface">{card.crop}</h2>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">{card.cropVariety}</p>
                        </div>
                      </div>
                      <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant">{card.cropNote}</p>
                      <div className="mt-space-md bg-surface-container-low p-space-sm rounded-lg flex flex-col space-y-space-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Projected Profit</span>
                          <span className="font-label-md text-label-md text-primary font-bold">{card.profit}</span>
                        </div>
                        <div className="flex items-center gap-space-xs text-primary">
                          <span className="material-symbols-outlined text-[16px]">yard</span>
                          <span className="font-label-sm text-label-sm font-medium">Enriches soil with organic green manure</span>
                        </div>
                      </div>
                      <button onClick={() => navigate('/planning/crop-plan')} className="w-full mt-space-md h-12 bg-surface-container-high text-primary font-label-md text-label-md rounded-xl flex items-center justify-center gap-space-xs active:bg-surface-container-highest transition-colors" type="button">
                        <span>Plan Zaid Crop</span>
                        <span className="material-symbols-outlined text-[18px]">add_task</span>
                      </button>
                    </>
                  )}

                  {/* Kharif completed + Kharif25 future */}
                  {(card.id === 'kharif' || card.id === 'kharif25') && (
                    <>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface mt-space-xs">{card.crop}</h2>
                      {card.cropNote && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{card.cropNote}</p>}
                      {card.metrics && (
                        <div className="flex flex-col space-y-1 mt-space-sm">
                          {card.metrics.map(m => (
                            <div key={m.label} className="flex justify-between items-baseline">
                              <span className="font-label-sm text-label-sm text-on-surface-variant">{m.label}</span>
                              <span className={`font-label-md text-label-md font-bold ${m.color}`}>{m.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KCC boost card */}
        <div className="bg-primary/10 rounded-xl p-space-md flex items-start gap-space-md shadow-sm mt-space-lg">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[22px]">savings</span>
          </div>
          <div className="flex-1">
            <h3 className="font-label-lg text-label-lg text-primary font-bold">Kisan Credit Card Boost</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Multi-crop planning helps you qualify for ₹11.5L Kisan Credit Card (KCC) limit enhancements.</p>
          </div>
        </div>
      </main>

      {/* Bottom nav */}
      
    </div>
  );
}
