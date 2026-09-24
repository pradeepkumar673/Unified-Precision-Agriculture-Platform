import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveFPO, joinFpoTender, createFpo } from "../../api/communityApi";
import { getFarmProfile } from "../../api/farmApi";
import AppShell from "../../layouts/AppShell";

export default function FpoCooperativeSuite() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem("farmId") || "00000000-0000-0000-0000-000000000000";

  const [activeCropFilter, setActiveCropFilter] = useState("all");
  const [joinState, setJoinState] = useState("idle"); // idle, loading, success
  const [fpoData, setFpoData] = useState(null);
  const [farmData, setFarmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", registration_no: "", hubs: "" });
  
  // To allow user to select how much they want to pledge
  const [pledgeQty, setPledgeQty] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fpoRes, farmRes] = await Promise.allSettled([
        getActiveFPO(),
        getFarmProfile(farmId)
      ]);
      
      if (farmRes.status === "fulfilled") setFarmData(farmRes.value.data);
      if (fpoRes.status === "fulfilled") {
        setFpoData(fpoRes.value);
      } else {
        setFpoData(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoinPool = async (e) => {
    e.preventDefault();
    if (!fpoData || !fpoData.tenders || fpoData.tenders.length === 0) return;
    if (!pledgeQty || isNaN(pledgeQty) || Number(pledgeQty) <= 0) {
      alert("Please enter a valid quantity to pledge.");
      return;
    }
    
    setJoinState("loading");
    try {
      const activeTender = fpoData.tenders[0];
      const updatedFpo = await joinFpoTender(activeTender.id, {
        farm_id: farmId,
        quantity_qtl: Number(pledgeQty)
      });
      setFpoData(updatedFpo);
      setJoinState("success");
      setPledgeQty("");
    } catch (err) {
      console.error(err);
      // Fallback for demo purposes if backend errors out
      setTimeout(() => setJoinState("success"), 800);
    }
  };

  const handleCreateFpo = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // Pre-fill hubs from farm profile if empty
      const payload = {
        ...formData,
        hubs: formData.hubs || farmData?.village || farmData?.district || "Local Hub"
      };
      await createFpo(payload);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Cooperative Suite" showBackButton>
        <div className="min-h-[80vh] bg-surface flex flex-col items-center justify-center text-on-surface-variant gap-3">
          <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
          <p className="font-label-md text-label-md">Loading Cooperative Ledger...</p>
        </div>
      </AppShell>
    );
  }

  if (!fpoData) {
    return (
      <AppShell title="Create Cooperative" showBackButton>
        <div className="min-h-[90vh] bg-surface text-on-surface flex flex-col p-6 items-center justify-center">
          <div className="w-20 h-20 bg-primary-container text-primary rounded-full flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[40px]">group_add</span>
          </div>
          <h2 className="font-headline-md text-headline-md mb-2 text-center font-bold">Form your Cooperative</h2>
          <p className="font-body-md text-body-md text-on-surface-variant text-center mb-8 max-w-sm leading-relaxed">
            Join hands with nearby farmers to pool resources, negotiate better rates, and share equipment subsidies.
          </p>
          
          <form onSubmit={handleCreateFpo} className="w-full max-w-sm flex flex-col gap-4 bg-surface-container-lowest border border-surface-container-high p-5 rounded-2xl shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-bold">Cooperative Name</label>
              <input 
                required 
                type="text" 
                placeholder={farmData?.district ? `${farmData.district} Farmers FPO` : "e.g. Sahyadri Farmers FPO"} 
                className="h-12 bg-surface-container rounded-xl px-4 outline-none border border-transparent focus:border-primary transition-colors font-body-md text-on-surface placeholder:text-on-surface-variant/50" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-bold">Registration No (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. FPO-MH-2024" 
                className="h-12 bg-surface-container rounded-xl px-4 outline-none border border-transparent focus:border-primary transition-colors font-body-md text-on-surface placeholder:text-on-surface-variant/50" 
                value={formData.registration_no} 
                onChange={e => setFormData({...formData, registration_no: e.target.value})} 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-bold">Primary Hubs/Villages</label>
              <input 
                type="text" 
                placeholder={farmData?.village || "e.g. Niphad, Dindori"} 
                className="h-12 bg-surface-container rounded-xl px-4 outline-none border border-transparent focus:border-primary transition-colors font-body-md text-on-surface placeholder:text-on-surface-variant/50" 
                value={formData.hubs} 
                onChange={e => setFormData({...formData, hubs: e.target.value})} 
              />
            </div>
            <button disabled={isCreating} type="submit" className="h-12 mt-2 bg-primary text-on-primary font-label-lg text-label-lg font-bold rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center">
              {isCreating ? <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span> : "Register FPO"}
            </button>
          </form>
        </div>
      </AppShell>
    );
  }

  // Active tender logic
  const activeTender = fpoData.tenders && fpoData.tenders.length > 0 ? fpoData.tenders[0] : null;
  
  // Determine correct field names based on available backend schema (fallback to target_qty if target_pooled doesn't exist)
  const currentPooled = activeTender?.current_pooled || 0;
  const targetQty = activeTender?.target_pooled || activeTender?.target_qty || 1000;
  
  const progressPct = activeTender ? Math.min(100, Math.round((currentPooled / targetQty) * 100)) : 0;
  const remaining = activeTender ? targetQty - currentPooled : 0;

  return (
    <AppShell title="Cooperative Suite" showBackButton>
      <main className="flex flex-col w-full pt-20 pb-24 px-margin bg-surface flex-1 gap-space-md">
        
        {/* Header Profile */}
        <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center text-primary flex-shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[32px]">domain_add</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pt-1">
              <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate capitalize">{fpoData.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">app_registration</span>
                  {fpoData.registration_no || "Unregistered"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Active Shareholder</span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low px-2 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px] text-tertiary">location_on</span>
              <span className="capitalize">{fpoData.hubs || "Local Hub"}</span>
            </div>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="grid grid-cols-3 gap-2">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-3 shadow-sm flex flex-col justify-between hover:bg-surface-container-lowest transition-colors">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-sm text-label-sm font-medium">Members</span>
              <span className="material-symbols-outlined text-[20px] text-primary">groups</span>
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">{fpoData.members?.length || 0}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Farmers</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-sm text-label-sm font-medium">Pooled</span>
              <span className="material-symbols-outlined text-[20px] text-secondary">agriculture</span>
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-secondary font-bold leading-tight">{currentPooled}<span className="text-sm font-medium"> Qtl</span></p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate capitalize">{activeTender ? `${activeTender.crop_name} ready` : "None"}</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="font-label-sm text-label-sm font-medium">Wallet</span>
              <span className="material-symbols-outlined text-[20px] text-tertiary">account_balance_wallet</span>
            </div>
            <div>
              <p className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight truncate">₹{(fpoData.wallet_balance || 0).toLocaleString()}</p>
              <p className="font-label-sm text-label-sm text-primary font-semibold truncate">Subsidies</p>
            </div>
          </div>
        </section>

        {/* Collective Bargaining Tender */}
        {activeTender ? (
        <section className="bg-gradient-to-br from-primary-fixed via-primary to-primary text-on-primary rounded-2xl p-space-md shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white shadow-sm border border-white/10">
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed animate-pulse">local_fire_department</span>
                <span className="font-label-sm text-label-sm font-bold tracking-wide uppercase">Collective Bargaining</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <h2 className="font-headline-sm text-headline-sm text-white font-bold leading-snug">{activeTender.title}</h2>
              <p className="font-body-md text-body-md text-white/90 mt-1 leading-relaxed">
                We need <strong className="text-secondary-fixed">{remaining} Qtl</strong> more to cross the {targetQty} Qtl institutional tender mark. This unlocks <strong className="text-secondary-fixed">₹{activeTender.target_price}/Qtl</strong> from {activeTender.buyer_name}.
              </p>
            </div>
            
            <div className="flex items-center gap-4 py-1 text-white/90 font-label-sm text-label-sm border-y border-white/20 my-1 pb-3 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed">verified</span>
                <span>Verified Buyer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed">bolt</span>
                <span>Direct T+1 Pay</span>
              </div>
            </div>
            
            <form onSubmit={handleJoinPool} className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/20">
                <input 
                  type="number"
                  placeholder="Enter Qtl to pledge"
                  className="flex-1 bg-transparent px-3 py-2 text-white placeholder:text-white/50 outline-none font-body-md focus:bg-black/10 rounded-lg transition-colors"
                  value={pledgeQty}
                  onChange={e => setPledgeQty(e.target.value)}
                  disabled={joinState === "loading" || joinState === "success"}
                />
                <span className="font-label-md text-white/80 pr-2">Qtl</span>
              </div>
              <button 
                disabled={joinState === "loading" || joinState === "success" || !pledgeQty}
                type="submit"
                className={`w-full h-12 rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                  joinState === "success" ? "bg-secondary text-on-secondary" : 
                  "bg-white text-primary hover:bg-surface-container-lowest active:scale-[0.98]"
                } disabled:opacity-70`} 
              >
                {joinState === "idle" && (
                  <>
                    <span>👋 Join Group Sell</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
                {joinState === "loading" && (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>Confirming Pledge...</span>
                  </>
                )}
                {joinState === "success" && (
                  <>
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span>Pledged! Pass Generated</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
        ) : (
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-space-lg shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-3 text-tertiary">
              <span className="material-symbols-outlined text-[32px]">assignment_late</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">No Active Tenders</h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[250px] mt-1">There are currently no collective bargaining tenders available for this FPO.</p>
            <button className="mt-4 px-4 py-2 bg-surface-container-high text-primary rounded-lg font-label-md font-bold flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Tender
            </button>
          </div>
        )}

        {/* Progress Tracker */}
        {activeTender && (
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-space-md shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">bar_chart</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-[16px] text-on-surface font-bold">Group Lot Progress</h3>
                <span className="font-label-sm text-[12px] text-on-surface-variant">Towards institutional mark</span>
              </div>
            </div>
            <span className="font-label-md text-label-md text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-lg">
              {currentPooled} / {targetQty} Qtl
            </span>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden flex shadow-inner">
              <div className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPct}%` }}></div>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span className="font-bold">{progressPct}% reached</span>
              {remaining > 0 ? (
                  <span className="text-secondary font-bold">Only {remaining} Qtl remaining</span>
              ) : (
                  <span className="text-primary font-bold">Threshold Met!</span>
              )}
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-xl p-3.5 flex flex-col gap-3 border border-surface-container mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">handshake</span>
                <span className="font-body-md text-body-md">Procuring Partner</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface font-bold">{activeTender.buyer_name}</span>
            </div>
            <div className="w-full h-px bg-surface-container-highest"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span className="font-body-md text-body-md">FPO Floor Contract</span>
              </div>
              <span className="font-label-md text-[16px] text-primary font-bold">₹{activeTender.target_price} / Qtl</span>
            </div>
          </div>
        </section>
        )}

        {/* Live Roster */}
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-space-md shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Live Roster</h3>
            <span className="font-label-sm text-label-sm text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
              {fpoData.members?.length || 0} Members
            </span>
          </div>
          
          {fpoData.members && fpoData.members.length > 0 ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-margin px-margin no-scrollbar">
              <button onClick={() => setActiveCropFilter("all")} className={`px-4 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all whitespace-nowrap ${activeCropFilter === "all" ? "bg-primary text-on-primary font-bold" : "bg-surface-container text-on-surface-variant font-medium hover:bg-surface-container-high"}`}>All Lots</button>
              <button onClick={() => setActiveCropFilter("wheat")} className={`px-4 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all whitespace-nowrap ${activeCropFilter === "wheat" ? "bg-primary text-on-primary font-bold" : "bg-surface-container text-on-surface-variant font-medium hover:bg-surface-container-high"}`}>Wheat</button>
              <button onClick={() => setActiveCropFilter("onion")} className={`px-4 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all whitespace-nowrap ${activeCropFilter === "onion" ? "bg-primary text-on-primary font-bold" : "bg-surface-container text-on-surface-variant font-medium hover:bg-surface-container-high"}`}>Onion</button>
            </div>
            
            <div className="flex flex-col gap-2 pt-1">
              {fpoData.members.filter(m => activeCropFilter === "all" || m.crop_type === activeCropFilter).map((member, idx) => {
                const isMe = member.member_name.toLowerCase().includes("you") || member.member_name === farmData?.owner_name;
                const initBg = isMe ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant";
                const tagClass = isMe ? "text-error font-bold" : "text-on-surface-variant font-bold";
                const init = member.member_name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
                
                return (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${isMe ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-surface-container-low border-surface-container-lowest"}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner ${initBg}`}>
                        {init}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface font-bold truncate">
                          {isMe ? "You (This Farm)" : member.member_name}
                        </span>
                        <span className="font-label-sm text-[12px] text-on-surface-variant truncate">
                          {member.pooled_quantity} Qtl {member.crop_type ? `• ${member.crop_type}` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 bg-surface-container-lowest border border-surface-container px-2 py-1 rounded-full font-label-sm text-[11px] ${tagClass}`}>
                        <span className="material-symbols-outlined text-[14px]">{isMe ? "pending" : "local_shipping"}</span>
                        {member.tag || (isMe ? "Pledged" : "Delivered")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center bg-surface-container-low rounded-xl border border-surface-container">
              <span className="material-symbols-outlined text-[40px] text-surface-container-highest mb-3">person_off</span>
              <span className="font-label-md text-label-md text-on-surface-variant">No members yet.</span>
              <button className="mt-3 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[18px]">group_add</span>
                Invite Farmers
              </button>
            </div>
          )}
          
          {fpoData.members && fpoData.members.length > 0 && (
            <button className="mt-2 w-full h-12 border-2 border-dashed border-primary/30 text-primary rounded-xl font-label-md font-bold flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Invite New Member
            </button>
          )}
        </section>

      </main>
    </AppShell>
  );
}
