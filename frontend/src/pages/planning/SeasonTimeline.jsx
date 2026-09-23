import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCropPlan, createRotationPlan } from '../../api/planningApi';
import { getFarmProfile } from '../../api/farmApi';



export default function SeasonTimeline() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActivities, setShowActivities] = useState(false);

  const CROP_ACTIVITIES = {
    sugarcane:  ['Soil preparation', 'Planting setts', 'Irrigation #1', 'Basal fertilizer', 'Earthing up', 'Weeding', 'Nitrogen top-dress', 'Irrigation #2', 'Irrigation #3', 'Pest scouting', 'De-trashing', 'Harvesting'],
    wheat:      ['Soil tillage', 'Seed treatment', 'Sowing', 'Irrigation (CRI)', 'Basal fertilizer', 'Weeding', 'Nitrogen top-dress', 'Irrigation (tillering)', 'Irrigation (boot)', 'Pest spray', 'Harvesting'],
    rice:       ['Nursery prep', 'Transplanting', 'Irrigation', 'Basal fertilizer', 'Weeding', 'Nitrogen split', 'Pest scouting', 'Irrigation #2', 'Harvesting'],
    maize:      ['Soil prep', 'Sowing', 'Basal fertilizer', 'Irrigation', 'Weeding', 'Nitrogen top-dress', 'Pest spray', 'Harvesting'],
    cotton:     ['Land prep', 'Seed sowing', 'Gap filling', 'Irrigation', 'Fertilizer basal', 'Boll weevil spray', 'Nitrogen split', 'Irrigation #2', 'Defoliation', 'Picking'],
    soybean:    ['Land prep', 'Seed treatment', 'Sowing', 'Basal fertilizer', 'Weeding', 'Irrigation', 'Pest scouting', 'Harvesting'],
    default:    ['Land preparation', 'Sowing', 'Irrigation', 'Fertilizer application', 'Weeding', 'Pest management', 'Harvesting'],
  };

  useEffect(() => {
    console.log('[Timeline] farmId from localStorage:', farmId);
    if (!farmId) {
      console.warn('[Timeline] No farmId found, aborting.');
      setLoading(false);
      return;
    }

    // Fetch farm profile and latest crop plan concurrently
    Promise.all([getFarmProfile(farmId), getCropPlan(farmId).catch(() => ({ data: [] }))])
      .then(([farmRes, planRes]) => {
        const farm = farmRes.data;
        const latestPlan = planRes.data?.[0];
        console.log('[Timeline] Farm profile:', farm);

        const soilN = farm?.soil_nitrogen ?? 35.5;
        const soilOC = farm?.soil_organic_carbon ?? 0.8;

        const activeCrop = latestPlan?.recommended_crop || farm?.current_crop || 'fallow';

        // crop_history may be empty [] — use activeCrop as fallback
        const historyItems = Array.isArray(farm?.crop_history) && farm.crop_history.length > 0
          ? farm.crop_history.map(h => (typeof h === 'string' ? h : h.crop))
          : ['wheat', 'rice', activeCrop];
        const lastCrops = historyItems.slice(0, 3);
        console.log('[Timeline] lastCrops:', lastCrops);

        return createRotationPlan({
          farm_id: farmId,
          soil_nitrogen: soilN,
          soil_organic_carbon: soilOC,
          last_3_crops: lastCrops,
        });
      })
      .then(res => {
        console.log('[Timeline] rotation plan response:', res?.data);
        if (res?.data?.timeline && res.data.timeline.length > 0) {
          setTimelineData(res.data.timeline);
        } else {
          console.warn('[Timeline] timeline empty or missing in response');
        }
      })
      .catch(err => console.error('[Timeline] Error:', err))
      .finally(() => setLoading(false));
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <span className="material-symbols-outlined text-[40px] text-primary animate-spin">progress_activity</span>
                <p className="font-body-md text-on-surface-variant text-center">AI is building your crop rotation timeline...</p>
              </div>
            ) : timelineData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant">calendar_clock</span>
                <p className="font-body-md text-on-surface-variant">No timeline data. Please create a crop plan first.</p>
              </div>
            ) : timelineData.map((card) => (
              <div key={card.id || card.crop} className="relative flex items-start space-x-space-md z-10">
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

                  {/* Active season card */}
                  {card.status === 'active' && (
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
                      <button onClick={() => setShowActivities(!showActivities)} className="w-full mt-space-md h-12 border border-primary text-primary font-label-md text-label-md rounded-xl flex items-center justify-center gap-space-xs active:bg-primary/10 transition-colors" type="button">
                        <span>{showActivities ? 'Hide' : 'Show'} Scheduled Activities</span>
                        <span className="material-symbols-outlined text-[18px]">{showActivities ? 'expand_less' : 'expand_more'}</span>
                      </button>

                      {showActivities && (
                        <div className="mt-space-md flex flex-col gap-3 relative">
                          <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-surface-container-highest"></div>
                          {(CROP_ACTIVITIES[card.crop.toLowerCase()] || CROP_ACTIVITIES.default).map((act, i, arr) => {
                            const isCompleted = (i / arr.length) < (card.progressPct / 100);
                            const isCurrent = (i / arr.length) >= (card.progressPct / 100) && (i - 1 < 0 || ((i - 1) / arr.length) < (card.progressPct / 100));
                            return (
                              <div key={i} className="flex items-center gap-3 relative z-10">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-primary text-on-primary' : isCurrent ? 'bg-secondary-container text-secondary border-2 border-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                  {isCompleted ? <span className="material-symbols-outlined text-[16px]">check</span> : <span className="text-[12px] font-bold">{i + 1}</span>}
                                </div>
                                <div className={`flex-1 ${isCompleted ? 'text-on-surface-variant line-through' : isCurrent ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                                  {act}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <button onClick={() => navigate('/planning/crop-plan')} className="w-full mt-space-md h-14 bg-secondary-container text-on-secondary-container font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-space-sm shadow-md active:scale-[0.98] transition-transform" type="button">
                        <span>View {card.crop} Advisory & Tasks</span>
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </button>
                    </>
                  )}

                  {/* Upcoming season card */}
                  {card.status === 'upcoming' && (
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
                        <span>Plan {card.crop} Now</span>
                        <span className="material-symbols-outlined text-[18px]">add_task</span>
                      </button>
                    </>
                  )}

                  {/* Completed / Future cards */}
                  {(card.status === 'completed' || card.status === 'future') && (
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
