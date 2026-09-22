import sys
content = """import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveFPO, joinFpoTender, createFpo } from '../../api/communityApi';

export default function FpoCooperativeSuite() {
  const navigate = useNavigate();
  const [activeCropFilter, setActiveCropFilter] = useState('all');
  const [joinState, setJoinState] = useState('idle'); // idle, loading, success
  const [fpoData, setFpoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', registration_no: '', hubs: '' });

  const fetchFpo = async () => {
    setLoading(true);
    try {
      const data = await getActiveFPO();
      setFpoData(data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setFpoData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFpo();
  }, []);

  const handleJoinPool = async () => {
    if (!fpoData || !fpoData.tenders || fpoData.tenders.length === 0) return;
    setJoinState('loading');
    try {
      const activeTender = fpoData.tenders[0];
      const farmId = localStorage.getItem('activeFarmId') || '00000000-0000-0000-0000-000000000000';
      const updatedFpo = await joinFpoTender(activeTender.id, {
        farm_id: farmId,
        quantity_qtl: 95
      });
      setFpoData(updatedFpo);
      setJoinState('success');
    } catch (err) {
      console.error(err);
      setJoinState('idle');
    }
  };

  const handleCreateFpo = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createFpo(formData);
      await fetchFpo();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined animate-spin text-[32px] mr-2">refresh</span> Loading Cooperative Ledger...</div>;
  }

  if (!fpoData) {
    return (
      <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col p-6 items-center justify-center pt-[64px]">
        <div className="w-16 h-16 bg-primary-container text-primary rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">group_add</span>
        </div>
        <h2 className="font-headline-md text-headline-md mb-2 text-center">Form your Cooperative</h2>
        <p className="font-body-md text-body-md text-on-surface-variant text-center mb-8 max-w-sm">Join hands with nearby farmers to pool resources, negotiate better rates, and share equipment subsidies.</p>
        
        <form onSubmit={handleCreateFpo} className="w-full max-w-sm flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Cooperative Name</label>
                <input required type="text" placeholder="e.g. Sahyadri Farmers FPO" className="h-12 bg-surface-container rounded-xl px-4 outline-none border-2 border-transparent focus:border-primary transition-colors font-body-md" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Registration No (Optional)</label>
                <input type="text" placeholder="e.g. FPO-MH-2024" className="h-12 bg-surface-container rounded-xl px-4 outline-none border-2 border-transparent focus:border-primary transition-colors font-body-md" value={formData.registration_no} onChange={e => setFormData({...formData, registration_no: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Primary Hubs/Villages</label>
                <input required type="text" placeholder="e.g. Niphad, Dindori" className="h-12 bg-surface-container rounded-xl px-4 outline-none border-2 border-transparent focus:border-primary transition-colors font-body-md" value={formData.hubs} onChange={e => setFormData({...formData, hubs: e.target.value})} />
            </div>
            <button disabled={isCreating} type="submit" className="h-12 mt-4 bg-primary text-on-primary font-label-lg text-label-lg font-bold rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center">
                {isCreating ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : 'Register FPO'}
            </button>
        </form>
      </div>
    );
  }

  const activeTender = fpoData.tenders && fpoData.tenders.length > 0 ? fpoData.tenders[0] : null;
  const progressPct = activeTender ? Math.min(100, Math.round((activeTender.current_pooled / activeTender.target_pooled) * 100)) : 0;
  const remaining = activeTender ? activeTender.target_pooled - activeTender.current_pooled : 0;

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
                  <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">{fpoData.name}</h1>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span>{fpoData.registration_no || 'Unregistered'}</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 flex items-center justify-between gap-space-sm bg-surface-container-low rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
              <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider truncate">Active Shareholder</span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-tertiary">location_on</span>
              <span>{fpoData.hubs}</span>
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
              <p className="font-headline-sm text-headline-sm text-on-surface leading-tight">{fpoData.members.length}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Farmers</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-xl p-2.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-label-sm text-label-sm">Pooled</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">agriculture</span>
            </div>
            <div>
              <p className="font-headline-sm text-headline-sm text-secondary leading-tight">{activeTender ? activeTender.current_pooled : 0}<span className="text-xs font-normal"> Qtl</span></p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{activeTender ? `${activeTender.crop_name} ready` : 'None'}</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-xl p-2.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-label-sm text-label-sm">Wallet</span>
              <span className="material-symbols-outlined text-[18px] text-tertiary">account_balance_wallet</span>
            </div>
            <div>
              <p className="font-headline-sm text-headline-sm text-on-surface leading-tight">₹{fpoData.wallet_balance}<span className="text-xs font-normal">L</span></p>
              <p className="font-label-sm text-label-sm text-primary font-semibold truncate">Subsidies</p>
            </div>
          </div>
        </section>

        {activeTender ? (
        <section className="bg-gradient-to-br from-primary-container via-primary to-primary-container text-on-primary rounded-xl p-space-md shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 bg-surface-container-lowest/15 backdrop-blur-sm px-2.5 py-1 rounded-full text-on-primary">
                <span className="material-symbols-outlined text-[16px] text-secondary-fixed animate-pulse">local_fire_department</span>
                <span className="font-label-sm text-label-sm font-bold tracking-wide uppercase">Collective Bargaining</span>
              </div>
            </div>
            
            <div>
              <h2 className="font-headline-md text-headline-md text-on-primary leading-tight">{activeTender.title}</h2>
              <p className="font-body-md text-body-md text-on-primary/90 mt-1">
                Pooling your <strong className="text-primary-fixed">95 Qtl</strong> crosses the {activeTender.target_pooled} Qtl institutional tender mark, unlocking <strong className="text-primary-fixed">₹{activeTender.target_price}/Qtl</strong> from {activeTender.buyer_name}.
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
        ) : (
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[48px] text-tertiary mb-2">assignment_late</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">No Active Tenders</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">There are currently no active collective bargaining tenders available for this FPO.</p>
          </div>
        )}

        {activeTender && (
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">bar_chart</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Group Lot Progress</h3>
            </div>
            <span className="font-label-md text-label-md text-primary font-bold">{activeTender.current_pooled} / {activeTender.target_pooled} Qtl</span>
          </div>
          
          <div className="space-y-1.5">
            <div className="w-full h-3.5 bg-surface-container rounded-full overflow-hidden flex">
              <div className="bg-primary h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }}></div>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span>{progressPct}% reached threshold</span>
              {remaining > 0 ? (
                  <span className="text-secondary font-bold">Only {remaining} Qtl remaining</span>
              ) : (
                  <span className="text-primary font-bold">Threshold Met!</span>
              )}
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Procuring Partner</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold text-right">{activeTender.buyer_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">FPO Floor Contract</span>
              <div className="flex items-center gap-1.5">
                <span className="font-label-md text-label-md text-primary font-bold">₹{activeTender.target_price} / Qtl</span>
              </div>
            </div>
          </div>
        </section>
        )}

        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Live Ledger &amp; Roster</h3>
            <span className="font-label-sm text-label-sm text-primary font-bold">{fpoData.members.length} Members joined</span>
          </div>
          
          {fpoData.members.length > 0 ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-margin px-margin hide-scrollbar">
              <button onClick={() => setActiveCropFilter('all')} className={`filter-chip px-3 py-1.5 rounded-full font-label-sm text-label-sm shadow-sm transition-colors whitespace-nowrap ${activeCropFilter === 'all' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant font-medium'}`}>All Lots</button>
              <button onClick={() => setActiveCropFilter('wheat')} className={`filter-chip px-3 py-1.5 rounded-full font-label-sm text-label-sm shadow-sm transition-colors whitespace-nowrap ${activeCropFilter === 'wheat' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant font-medium'}`}>Wheat Lots</button>
              <button onClick={() => setActiveCropFilter('onion')} className={`filter-chip px-3 py-1.5 rounded-full font-label-sm text-label-sm shadow-sm transition-colors whitespace-nowrap ${activeCropFilter === 'onion' ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant font-medium'}`}>Onion Lots</button>
            </div>
            
            <div className="flex flex-col gap-2 pt-1">
              {fpoData.members.filter(m => activeCropFilter === 'all' || m.crop_type === activeCropFilter).map((member, idx) => {
                const isMe = member.member_name.includes('You');
                const bgClass = isMe ? 'bg-primary-fixed/20 border-l-4 border-primary shadow-sm' : 'bg-surface-container-low';
                const initBg = isMe ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant';
                const tagClass = isMe ? 'text-error font-semibold' : 'text-on-surface-variant font-semibold';
                const init = member.member_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <div key={idx} className={`member-item flex items-center justify-between p-3 rounded-xl ${bgClass}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${initBg}`}>
                        {init}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">{member.member_name}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{member.pooled_quantity} Qtl Pooled</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded-full font-label-sm text-label-sm ${tagClass}`}>
                        <span className="material-symbols-outlined text-[14px]">{isMe ? 'pending' : 'local_shipping'}</span>
                        {member.tag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-[32px] text-surface-container-highest mb-2">person_off</span>
              <span className="font-label-md text-label-md text-on-surface-variant">No members yet.</span>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
"""
with open("frontend/src/pages/community/FpoCooperativeSuite.jsx", "w", encoding="utf-8") as f:
    f.write(content)
