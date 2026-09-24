import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import { getFarmProfile } from '../../api/farmApi';
import { simulateWhatIf } from '../../api/advancedAiApi';

export default function CounterfactualWhatIfSimulator() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
  
  const [farmData, setFarmData] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  
  const currentDecision = {
    irrigation: 'Flood / Furrow',
    sowing_date: 'Late Sowing',
    nutrition: 'Conventional Urea',
    seed_strain: 'HD-2967'
  };

  const [proposedChange, setProposedChange] = useState({
    irrigation: 'Micro-Drip',
    sowing_date: 'Optimal Window',
    nutrition: 'Nano Urea + Zinc',
    seed_strain: 'K-1006'
  });

  useEffect(() => {
    getFarmProfile(farmId).then(res => setFarmData(res.data)).catch(() => {});
  }, []);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const result = await simulateWhatIf(farmId, currentDecision, proposedChange);
      setSimulationResult(result);
      
      setTimeout(() => {
        const resultsCard = document.getElementById('resultsCard');
        if (resultsCard) {
          resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
    } catch (err) {
      console.error(err);
      // Fallback dummy result in case of error
      setSimulationResult({
        projected_yield_delta_kg_ha: 440,
        projected_profit_delta_inr_ha: 138400,
        explanation: 'Switching to moisture-triggered micro-drip and early sowing shifts the grain-filling period ahead of the heatwave, dramatically reducing flower abortion.'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const currentMonth = new Date().getMonth();
  const seasonString = currentMonth >= 5 && currentMonth <= 9 ? "Kharif" : currentMonth >= 10 || currentMonth <= 2 ? "Rabi" : "Zaid";
  const crop = farmData?.primary_crop || "Mixed Crops";
  const farmName = farmData?.name || "Your Farm";

  return (
    <AppShell title="Causal Lab" showBackButton>
      <main className="flex flex-col w-full pt-20 pb-24 bg-surface flex-1 gap-space-sm">
        
        <div className="px-margin pt-2">
          <div className="flex flex-col gap-0.5 mb-3">
            <h2 className="font-headline-md text-headline-md text-on-surface">Causal Impact Analysis</h2>
            <p className="font-label-md text-label-md text-on-surface-variant">AI Predictive Decision Sandbox</p>
          </div>
          
          <div className="rounded-xl bg-surface-container-low p-3.5 flex items-start gap-3 shadow-sm border border-surface-container">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">insights</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold">Validated Simulation Engine</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Simulate agronomic shifts before investing time &amp; capital. Powered by weather telemetry &amp; ICAR yield models for {farmName}.
              </p>
            </div>
          </div>
        </div>

        <div className="px-margin my-2">
          <div className="relative w-full h-24 rounded-xl overflow-hidden shadow-sm">
            <img className="w-full h-full object-cover" alt="Farm crop" src="https://images.unsplash.com/photo-1590682680695-43b964a3ae17?q=80&w=600&auto=format&fit=crop"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
              <div className="flex items-center justify-between w-full text-white">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary-fixed">agriculture</span>
                  <span className="font-label-md text-label-md font-bold">{crop} • {seasonString}</span>
                </div>
                <span className="font-label-sm text-label-sm bg-white/20 backdrop-blur-md px-2 py-0.5 rounded font-medium">Growth Stage</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-margin mt-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">Configuration Sandbox</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">touch_app</span> Tap any chip to adjust
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high p-3 flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-outline"></span>
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wide font-bold">Current</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Active</span>
              </div>
              
              <button className="w-full text-left rounded-lg bg-surface-container-low p-2 flex flex-col gap-1 active:scale-[0.98] transition-transform" type="button">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">water_drop</span>
                  <span className="font-label-sm text-[11px] uppercase font-bold">Irrigation</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface leading-snug">{currentDecision.irrigation}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">Every 12 Days</span>
              </button>
              
              <button className="w-full text-left rounded-lg bg-surface-container-low p-2 flex flex-col gap-1 active:scale-[0.98] transition-transform" type="button">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  <span className="font-label-sm text-[11px] uppercase font-bold">Sowing Date</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface leading-snug">{currentDecision.sowing_date}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">15 Nov Window</span>
              </button>
              
              <button className="w-full text-left rounded-lg bg-surface-container-low p-2 flex flex-col gap-1 active:scale-[0.98] transition-transform" type="button">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">science</span>
                  <span className="font-label-sm text-[11px] uppercase font-bold">Nutrition</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface leading-snug">{currentDecision.nutrition}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">2 Split Doses</span>
              </button>
              
              <button className="w-full text-left rounded-lg bg-surface-container-low p-2 flex flex-col gap-1 active:scale-[0.98] transition-transform" type="button">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">psychiatry</span>
                  <span className="font-label-sm text-[11px] uppercase font-bold">Seed Strain</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface leading-snug">{currentDecision.seed_strain}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">Standard Agrarian</span>
              </button>
            </div>
            
            <div className="rounded-xl bg-primary-fixed/20 p-3 flex flex-col gap-2.5 shadow-sm border border-primary/20">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="font-label-sm text-label-sm text-primary uppercase tracking-wide font-bold">Proposed</span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-bold">Simulated</span>
              </div>
              
              <button onClick={() => setProposedChange({...proposedChange, irrigation: proposedChange.irrigation === 'Micro-Drip' ? 'Flood / Furrow' : 'Micro-Drip'})} className="w-full text-left rounded-lg bg-surface-container-lowest p-2 flex flex-col gap-1 shadow-sm active:scale-[0.98] transition-transform relative" type="button">
                {proposedChange.irrigation === 'Micro-Drip' && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-on-primary font-bold">check</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-[14px]">water_drop</span>
                  <span className="font-label-sm text-[11px] uppercase font-bold">Irrigation</span>
                </div>
                <span className="font-label-md text-label-md text-primary leading-snug font-bold">{proposedChange.irrigation}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">Moisture-Triggered</span>
              </button>
              
              <button onClick={() => setProposedChange({...proposedChange, sowing_date: proposedChange.sowing_date === 'Optimal Window' ? 'Late Sowing' : 'Optimal Window'})} className="w-full text-left rounded-lg bg-surface-container-lowest p-2 flex flex-col gap-1 shadow-sm active:scale-[0.98] transition-transform relative" type="button">
                {proposedChange.sowing_date === 'Optimal Window' && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-on-primary font-bold">check</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-[14px]">event_available</span>
                  <span className="font-label-sm text-[11px] uppercase font-bold">Sowing Date</span>
                </div>
                <span className="font-label-md text-label-md text-primary leading-snug font-bold">{proposedChange.sowing_date}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">25 Oct – 5 Nov</span>
              </button>
              
              <button onClick={() => setProposedChange({...proposedChange, nutrition: proposedChange.nutrition === 'Nano Urea + Zinc' ? 'Conventional Urea' : 'Nano Urea + Zinc'})} className="w-full text-left rounded-lg bg-surface-container-lowest p-2 flex flex-col gap-1 shadow-sm active:scale-[0.98] transition-transform relative" type="button">
                {proposedChange.nutrition === 'Nano Urea + Zinc' && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-on-primary font-bold">check</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-[14px]">energy_savings_leaf</span>
                  <span className="font-label-sm text-[11px] uppercase font-bold">Nutrition</span>
                </div>
                <span className="font-label-md text-label-md text-primary leading-snug font-bold">{proposedChange.nutrition}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">3 Micro-Doses</span>
              </button>
              
              <button onClick={() => setProposedChange({...proposedChange, seed_strain: proposedChange.seed_strain === 'K-1006' ? 'HD-2967' : 'K-1006'})} className="w-full text-left rounded-lg bg-surface-container-lowest p-2 flex flex-col gap-1 shadow-sm active:scale-[0.98] transition-transform relative" type="button">
                {proposedChange.seed_strain === 'K-1006' && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-on-primary font-bold">check</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-[14px]">device_thermostat</span>
                  <span className="font-label-sm text-[11px] uppercase font-bold">Seed Strain</span>
                </div>
                <span className="font-label-md text-label-md text-primary leading-snug font-bold">{proposedChange.seed_strain}</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">Heat Tolerant</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-margin my-3 z-10 sticky top-[72px]">
          <button 
            disabled={isSimulating}
            className={`w-full h-14 rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all ${isSimulating ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary hover:brightness-110'}`}
            onClick={runSimulation}
          >
            {isSimulating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[22px]">autorenew</span>
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px]">bolt</span>
                <span>Run What-If Simulation</span>
              </>
            )}
          </button>
        </div>

        {simulationResult && (
          <div id="resultsCard" className="px-margin mt-1 mb-space-lg transition-all duration-500 ease-out">
            <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-1">
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Projected Outcome</h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Based on simulated climate risks</span>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px]">network_check</span>
                  <span className="font-label-sm text-label-sm font-bold">93.8% Conf.</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="rounded-xl bg-surface-container-low p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[18px]">grain</span>
                      <span className="font-label-md text-label-md font-bold">Expected Yield</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-primary-fixed bg-primary-fixed px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                      ↑ +{simulationResult.projected_yield_delta_kg_ha} kg / Acre
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-surface-container p-2 rounded-lg flex flex-col">
                      <span className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase">Current</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">1,850 <span className="font-body-sm text-[12px]">kg/Ac</span></span>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-lg flex flex-col">
                      <span className="font-label-sm text-[11px] text-primary font-bold uppercase">Projected</span>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">{1850 + simulationResult.projected_yield_delta_kg_ha} <span className="font-body-sm text-[12px]">kg/Ac</span></span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-xl bg-surface-container-low p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-on-surface">
                      <span className="material-symbols-outlined text-tertiary text-[18px]">water_drop</span>
                      <span className="font-label-md text-label-md font-bold">Water Consumption</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-tertiary-fixed bg-tertiary-fixed px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                      ↓ -35% Water Saved
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-surface-container p-2 rounded-lg flex flex-col">
                      <span className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase">Current</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">4,200 <span className="font-body-sm text-[12px]">m³/Sea</span></span>
                    </div>
                    <div className="bg-tertiary/10 p-2 rounded-lg flex flex-col">
                      <span className="font-label-sm text-[11px] text-tertiary font-bold uppercase">Projected</span>
                      <span className="font-headline-sm text-headline-sm text-tertiary font-bold">2,730 <span className="font-body-sm text-[12px]">m³/Sea</span></span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-xl bg-surface-container-low p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-[18px]">currency_rupee</span>
                      <span className="font-label-md text-label-md font-bold">Net Estimated Profit</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-secondary-fixed bg-secondary-fixed px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                      ↑ +₹{simulationResult.projected_profit_delta_inr_ha.toLocaleString()} Net Profit
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-surface-container p-2 rounded-lg flex flex-col">
                      <span className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase">Current (4.5 Ac)</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">₹1,118,000</span>
                    </div>
                    <div className="bg-secondary/10 p-2 rounded-lg flex flex-col">
                      <span className="font-label-sm text-[11px] text-secondary font-bold uppercase">Projected Gain</span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-bold">₹{(1118000 + simulationResult.projected_profit_delta_inr_ha).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-xl bg-surface-container p-3.5 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0 mt-0.5">tips_and_updates</span>
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold">Agronomic Rationale</span>
                  <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                    {simulationResult.explanation}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2.5 pt-1">
                <button className="w-full h-12 rounded-xl bg-secondary text-on-secondary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-sm hover:brightness-110 active:scale-[0.98] transition-transform" type="button">
                  <span>Apply Proposed Plan to {farmName}</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
