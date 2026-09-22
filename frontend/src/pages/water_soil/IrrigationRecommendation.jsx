import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendIrrigation } from '../../api/waterSoilApi';
import { getFarmProfile } from '../../api/farmApi';
import { checkStress } from '../../api/visionForecastApi';

export default function IrrigationRecommendation() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
  const [irrigateState, setIrrigateState] = useState('idle'); // idle, loading, done
  const [delayState, setDelayState] = useState(false);
  const [audioVisible, setAudioVisible] = useState(false);
  const [farmProfile, setFarmProfile] = useState(null);
  const [stressData, setStressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, stressRes] = await Promise.all([
          getFarmProfile(farmId),
          checkStress({ farm_id: farmId }).catch(() => ({ data: null }))
        ]);
        setFarmProfile(profileRes.data);
        if (stressRes.data) setStressData(stressRes.data);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [farmId]);

  // Derived Values
  const moisturePct = stressData ? Math.round(Math.max(10, stressData.ndwi_value * 80)) : 34;
  const crop = farmProfile?.current_crop || 'Wheat';
  const size = farmProfile?.land_size_acres || 1.8;
  const stage = farmProfile?.crop_stage || 'Tillering';
  const soil = farmProfile?.soil_type?.replace('_', ' ') || 'Clay Loam';
  
  let stressLevel = 'Optimal';
  let stressColor = 'primary';
  let stressDesc = `${soil} is holding moisture well. No immediate irrigation needed.`;
  if (moisturePct < 25) {
    stressLevel = 'Critical Dry';
    stressColor = 'error';
    stressDesc = `Severe water stress! ${soil} is completely dry. Immediate irrigation required to save the crop.`;
  } else if (moisturePct < 45) {
    stressLevel = 'Mild Stress';
    stressColor = 'secondary';
    stressDesc = `Mild water stress detected. ${soil} retains moisture well, but irrigating soon will prevent dehydration.`;
  } else if (moisturePct > 75) {
    stressLevel = 'Saturated';
    stressColor = 'tertiary';
    stressDesc = `Soil is saturated. Delay irrigation to prevent root rot in ${soil}.`;
  }

  // Dynamic Power Schedule
  const now = new Date();
  const endHour = 13; // 1:30 PM
  const endMin = 30;
  const endDate = new Date(now);
  endDate.setHours(endHour, endMin, 0);
  if (now > endDate) endDate.setDate(endDate.getDate() + 1);
  const hrsLeft = Math.max(0, ((endDate - now) / (1000 * 60 * 60)).toFixed(1));
  const isWindowActive = now.getHours() >= 6 && now.getHours() < endHour;
  const estCost = Math.round(size * 78.5); // simple dynamic cost based on acreage

  const handleIrrigate = async () => {
    setIrrigateState('loading');
    try {
      await recommendIrrigation({
        farm_id: farmId,
        crop: crop,
        growth_stage: stage,
        current_moisture_pct: moisturePct,
      });
      setIrrigateState('done');
    } catch (err) {
      console.error(err);
      setIrrigateState('done');
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-primary">Loading field telemetry...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Top Fixed Application Bar */}
      

      {/* Floating Audio Banner (Toggled) */}
      <div className={`fixed top-[calc(5rem+env(safe-area-inset-top))] inset-x-margin z-40 transition-all duration-300 ${audioVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className="bg-primary text-on-primary p-3 rounded-xl shadow-lg flex items-center gap-3">
          <span className="material-symbols-outlined animate-pulse text-[24px]">graphic_eq</span>
          <p className="font-label-sm text-label-sm flex-1 leading-tight">
            "Your {crop} crop in Plot 1 is at {moisturePct}% moisture. {stressLevel === 'Optimal' ? 'No irrigation needed today.' : 'Irrigating today avoids stress.'}"
          </p>
          <button onClick={() => setAudioVisible(false)} className="p-1 rounded-full hover:bg-white/20 active:scale-95" type="button">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      <main className="flex flex-col w-full pt-24 pb-64 px-margin bg-background flex-1 space-y-space-md">
        {/* Context Headline */}
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Priority Plot</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">{crop} Plot 1 ({size} Ac)</h2>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Stage: {stage}</span>
        </div>

        {/* Moisture Dial Card */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-secondary-fixed/50 flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>dew_point</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Soil Moisture: {moisturePct}%</h3>
            </div>
            <span className={`bg-${stressColor}-fixed-dim text-on-${stressColor}-fixed-variant font-label-sm text-label-sm px-2.5 py-1 rounded-full font-bold uppercase tracking-wider`}>
              {stressLevel}
            </span>
          </div>
          
          {/* Segmented Moisture Status Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-full bg-surface-container rounded-full overflow-hidden flex relative">
              <div className="w-1/4 h-full bg-error-container" title="Critical Dry"></div>
              <div className="w-[20%] h-full bg-secondary-fixed" title="Stress Range"></div>
              <div className="w-[30%] h-full bg-primary-fixed" title="Optimal Range"></div>
              <div className="w-1/4 h-full bg-tertiary-fixed" title="Saturated"></div>
              {/* Indicator Marker at Dynamic % */}
              <div className="absolute top-0 bottom-0 w-2.5 bg-on-surface rounded-full shadow-md transform -translate-x-1/2" style={{ left: `${moisturePct}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm pt-0.5">
              <span className="text-error font-medium">Dry (&lt;25%)</span>
              <span className={`text-${stressColor} font-bold`}>Current: {moisturePct}%</span>
              <span className="text-primary font-bold">Target (45-65%)</span>
              <span className="text-tertiary font-medium">Wet (&gt;75%)</span>
            </div>
          </div>

          {/* Moisture Diagnostic Insight */}
          <div className="bg-surface-container-low rounded-lg p-3 flex items-start gap-2.5">
            <span className={`material-symbols-outlined text-[20px] text-${stressColor} mt-0.5 shrink-0`}>
              {moisturePct < 45 ? 'warning' : 'check_circle'}
            </span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-bold text-on-surface">
                {moisturePct < 45 ? `${stressLevel} Detected at Root Zone` : `${stressLevel} Moisture Maintained`}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {stressDesc}
              </span>
            </div>
          </div>
        </section>

        {/* Canal / Electricity Availability Card */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>electric_meter</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Borewell Power Schedule</h3>
            </div>
            <span className={`bg-${isWindowActive ? 'primary' : 'error'}-fixed text-on-${isWindowActive ? 'primary' : 'error'}-fixed font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold`}>
              {isWindowActive ? 'Active Grid' : 'Grid Offline'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-space-sm mt-1">
            <div className="bg-surface-container-low rounded-xl p-3 flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">3-Phase Window</span>
              <span className="font-label-lg text-label-lg text-on-surface font-bold mt-0.5">06:00 AM - 01:30 PM</span>
              <span className={`font-label-sm text-label-sm text-${isWindowActive ? 'primary' : 'error'} font-semibold mt-1 flex items-center gap-1`}>
                <span className="material-symbols-outlined text-[16px]">
                  {isWindowActive ? 'hourglass_top' : 'schedule'}
                </span>
                {isWindowActive ? `${hrsLeft} hrs left` : `Starts in ${hrsLeft} hrs`}
              </span>
            </div>
            <div className="bg-surface-container-low rounded-xl p-3 flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Est. Energy Cost</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5">₹{estCost} / cycle</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Subsidized Agri Rate</span>
            </div>
          </div>
        </section>

        {/* Water Conservation Tip Banner */}
        <section className="bg-surface-container rounded-xl p-space-md shadow-sm mb-space-sm flex items-start gap-space-sm">
          <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
            <span className="material-symbols-outlined text-[24px]">tips_and_updates</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-label-md text-label-md font-bold text-on-surface">Smart Field Tip</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
              Drip or furrow scheduling saves up to <strong className="text-primary font-bold">22% water</strong> compared to midday flood irrigation. Always cap off furrows before peak afternoon sun.
            </p>
          </div>
        </section>
      </main>

      {/* Sticky Action Footer Dock */}
      <footer className="fixed bottom-[4rem] w-full p-margin bg-surface-container-lowest/95 backdrop-blur-md shadow-xl flex flex-col gap-2 z-30 pb-safe">
        <button
          onClick={handleIrrigate}
          disabled={irrigateState !== 'idle'}
          className={`w-full h-14 rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md active:scale-[0.98] transition-all ${
            irrigateState === 'done' ? 'bg-primary-container text-on-primary opacity-90' : 'bg-primary text-on-primary'
          }`}
          type="button"
        >
          {irrigateState === 'done' ? (
            <><span className="material-symbols-outlined text-[26px]">task_alt</span><span>Logged: Irrigation Recorded</span></>
          ) : irrigateState === 'loading' ? (
            <><span className="material-symbols-outlined text-[26px] animate-spin">sync</span><span>Saving...</span></>
          ) : (
            <><span className="material-symbols-outlined text-[26px]">water_drop</span><span>Irrigate Now (Est {(size * 2.5).toFixed(1)} Hrs)</span></>
          )}
        </button>
        <button
          onClick={() => setDelayState(true)}
          disabled={delayState || irrigateState === 'done'}
          className="w-full h-12 bg-surface-container text-on-surface rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 active:bg-surface-container-high transition-colors"
          type="button"
        >
          {delayState ? (
            <><span className="material-symbols-outlined text-[22px] text-secondary">cloud_done</span><span>Postponed: Sensor re-check at 06:00 PM</span></>
          ) : (
            <><span className="material-symbols-outlined text-[20px]">schedule</span><span>Delay Irrigation</span></>
          )}
        </button>
      </footer>

      {/* Bottom Nav */}
      
    </div>
  );
}
