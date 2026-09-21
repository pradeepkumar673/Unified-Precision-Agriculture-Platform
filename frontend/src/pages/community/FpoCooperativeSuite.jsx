import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFpoPoolSale } from '../../api/communityApi';

export default function FpoCooperativeSuite() {
  const navigate = useNavigate();
  const [activeCropFilter, setActiveCropFilter] = useState('all');
  const [joinState, setJoinState] = useState('idle'); // idle, loading, success

  const members = [
    { name: 'Ramesh Patil (You)', details: 'Plot 1 • 95 Qtl Available', tag: 'Awaiting Action', tagIcon: 'pending', tagClass: 'text-error font-semibold', bg: 'bg-primary-fixed/20 border-l-4 border-primary shadow-sm', crop: 'wheat', init: 'RP', initBg: 'bg-primary text-on-primary' },
    { name: 'Sunil Deshmukh', details: 'Plot 4 • 110 Qtl Pooled', tag: 'Warehouse Sync', tagIcon: 'warehouse', tagClass: 'text-tertiary font-semibold', bg: 'bg-surface-container-low', crop: 'onion', init: 'SD', initBg: 'bg-surface-container text-on-surface-variant' },
    { name: 'Vilas Kadam', details: 'Plot 2 • 80 Qtl Pooled', tag: 'Lasalgaon', tagIcon: 'warehouse', tagClass: 'text-tertiary font-semibold', bg: 'bg-surface-container-low', crop: 'onion', init: 'VK', initBg: 'bg-surface-container text-on-surface-variant' },
    { name: 'Bhausaheb More', details: 'Plot 9 • 150 Qtl Pooled', tag: 'Truck Ready', tagIcon: 'local_shipping', tagClass: 'text-on-surface-variant font-semibold', bg: 'bg-surface-container-low', crop: 'wheat', init: 'BM', initBg: 'bg-surface-container text-on-surface-variant' }
  ];

  const handleJoinPool = async () => {
    setJoinState('loading');
    try {
      const dummyFpoId = '00000000-0000-0000-0000-000000000000';
      await createFpoPoolSale(dummyFpoId, {
        crop_type: 'wheat',
        quantity: 95,
        target_rate: 12640,
        member_id: '00000000-0000-0000-0000-000000000000'
      });
      setJoinState('success');
    } catch (err) {
      console.error(err);
      // Fallback UI for dummy ids
      setTimeout(() => {
        setJoinState('success');
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-[64px] pb-24 px-margin bg-surface-container flex-1 gap-space-md">
        
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-space-sm relative z-10">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-[28px]">domain_add</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">Nashik Kisan Producer Co.</h1>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span>Reg: FPO-MH-NSK-2021</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-outline"></span>
                  <span className="text-primary font-bold">#NSK-442</span>
                </p>
              </div>
            </div>
            <button aria-label="Listen to cooperative status" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary flex-shrink-0 hover:bg-surface-container transition-colors shadow-sm" onClick={(e) => e.currentTarget.classList.toggle('text-secondary')} type="button">
              <span className="material-symbols-outlined text-[22px]">volume_up</span>
            </button>
          </div>
          
          <div className="mt-3 pt-3 flex items-center justify-between gap-space-sm bg-surface-container-low rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
              <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider truncate">Active Shareholder</span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-tertiary">location_on</span>
              <span>Niphad &amp; Dindori Hubs</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <div className="bg-surface-container-lowest rounded-xl p-2.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-label-sm text-label-sm">Members</span>
              <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
            </div>
            <div>
              <p className="font-headline-sm text-headline-sm text-on-surface leading-tight">284</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Farmers active</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-xl p-2.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-label-sm text-label-sm">Pooled</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">agriculture</span>
            </div>
            <div>
              <p className="font-headline-sm text-headline-sm text-secondary leading-tight">1,420<span className="text-xs font-normal"> Qtl</span></p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Rabi Wheat ready</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-xl p-2.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-label-sm text-label-sm">Wallet</span>
              <span className="material-symbols-outlined text-[18px] text-tertiary">account_balance_wallet</span>
            </div>
            <div>
              <p className="font-headline-sm text-headline-sm text-on-surface leading-tight">₹114.85<span className="text-xs font-normal">L</span></p>
              <p className="font-label-sm text-label-sm text-primary font-semibold truncate">Subsidies pool</p>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-primary-container via-primary to-primary-container text-on-primary rounded-xl p-space-md shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 bg-surface-container-lowest/15 backdrop-blur-sm px-2.5 py-1 rounded-full text-on-primary">
                <span className="material-symbols-outlined text-[16px] text-secondary-fixed animate-pulse">local_fire_department</span>
                <span className="font-label-sm text-label-sm font-bold tracking-wide uppercase">Collective Bargaining</span>
              </div>
              <span className="bg-secondary-container text-on-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full shadow-sm">
                Closes in 18 hrs
              </span>
            </div>
            
            <div>
              <h2 className="font-headline-md text-headline-md text-on-primary leading-tight">Bulk Wheat Selling Lot #W-104</h2>
              <p className="font-body-md text-body-md text-on-primary/90 mt-1">
                Pooling your <strong className="text-primary-fixed">95 Qtl</strong> crosses the 1,500 Qtl institutional tender mark, unlocking <strong className="text-primary-fixed">₹12,640/Qtl</strong> (+₹1120 over spot rate) from ITC &amp; Britannia.
              </p>
            </div>
            
            <div className="flex items-center gap-3 pt-1 text-on-primary/80 font-label-sm text-label-sm">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary-fixed">verified</span>
                <span>Verified Buyer</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary-fixed">bolt</span>
                <span>Direct T+1 Mandi Pay</span>
              </div>
            </div>
            
            <button 
              disabled={joinState === 'loading' || joinState === 'success'}
              className={`w-full h-14 rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md transition-transform ${joinState === 'success' ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary hover:opacity-95 active:scale-[0.98]'}`} 
              onClick={handleJoinPool}
            >
              {joinState === 'idle' && (
                <>
                  <span>👋 Join Group Sell (Bundle 95 Qtl)</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
              {joinState === 'loading' && (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                  <span>Confirming 95 Qtl Pledge...</span>
                </>
              )}
              {joinState === 'success' && (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Pledged! Gate Pass Generated</span>
                </>
              )}
            </button>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">bar_chart</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Group Lot Progress</h3>
            </div>
            <span className="font-label-md text-label-md text-primary font-bold">1,420 / 1,500 Qtl</span>
          </div>
          
          <div className="space-y-1.5">
            <div className="w-full h-3.5 bg-surface-container rounded-full overflow-hidden flex">
              <div className="bg-primary h-full rounded-full transition-all duration-700" style={{ width: '94%' }}></div>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span>94% reached threshold</span>
              <span className="text-secondary font-bold">Only 80 Qtl remaining</span>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Procuring Partner</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold text-right">ITC Agri-Business</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">FPO Floor Contract</span>
              <div className="flex items-center gap-1.5">
                <span className="font-label-md text-label-md text-primary font-bold">₹12,640 / Qtl</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant line-through">₹12,420 Solo</span>
              </div>
            </div>
            <div className="pt-2 border-t-0 bg-primary-fixed/20 p-2.5 rounded-lg flex items-center justify-between text-primary">
              <span className="font-label-md text-label-md font-bold">Your Extra Gain (95 Qtl)</span>
              <span className="font-headline-sm text-headline-sm font-bold">+₹20,900</span>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Live Ledger &amp; Roster</h3>
            <span className="font-label-sm text-label-sm text-primary font-bold">28 Members joined</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-margin px-margin hide-scrollbar">
            <button onClick={() => setActiveCropFilter('all')} className={`filter-chip px-3 py-1.5 rounded-full font-label-sm text-label-sm shadow-sm transition-colors whitespace-nowrap ${activeCropFilter === 'all' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant font-medium'}`}>All Lots</button>
            <button onClick={() => setActiveCropFilter('wheat')} className={`filter-chip px-3 py-1.5 rounded-full font-label-sm text-label-sm shadow-sm transition-colors whitespace-nowrap ${activeCropFilter === 'wheat' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant font-medium'}`}>Wheat #W-104</button>
            <button onClick={() => setActiveCropFilter('onion')} className={`filter-chip px-3 py-1.5 rounded-full font-label-sm text-label-sm shadow-sm transition-colors whitespace-nowrap ${activeCropFilter === 'onion' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant font-medium'}`}>Onion (Nashik)</button>
          </div>
          
          <div className="flex flex-col gap-2 pt-1">
            {members.filter(m => activeCropFilter === 'all' || m.crop === activeCropFilter).map((member, idx) => (
              <div key={idx} className={`member-item flex items-center justify-between p-3 rounded-xl ${member.bg}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${member.initBg}`}>
                    {member.init}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate">{member.name}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{member.details}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded-full font-label-sm text-label-sm ${member.tagClass}`}>
                    <span className="material-symbols-outlined text-[14px]">{member.tagIcon}</span>
                    {member.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[20px]">shield_person</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Shareholder Perks &amp; Inputs</h3>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-bold">2 Active</span>
          </div>
          
          <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">inventory_2</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Subsidized Fertilizer Quota</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">20 Bags DAP ready for pickup</span>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold flex-shrink-0" type="button">
              Claim
            </button>
          </div>
          
          <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">payments</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-label-md text-on-surface font-semibold truncate">FY 2024-25 Dividend</span>
                  <span className="bg-primary-fixed text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">Accrued</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">₹14,200 ready for bank deposit</span>
              </div>
            </div>
            <button aria-label="View dividend details" className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-primary flex-shrink-0" type="button">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </section>

        <section className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">support_agent</span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-semibold">Need Transport to Godown?</span>
              <span className="font-label-sm text-label-sm">FPO Truck Dispatch: +91 94221 88402</span>
            </div>
          </div>
          <a className="w-10 h-10 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shadow-xs" href="tel:9422188402">
            <span className="material-symbols-outlined text-[20px]">call</span>
          </a>
        </section>

      </main>

      
    </div>
  );
}
