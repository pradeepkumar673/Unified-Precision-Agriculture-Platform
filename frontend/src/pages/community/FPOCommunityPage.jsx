import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveFPO, createFpo, createShgGroup, joinFpoTender } from "../../api/communityApi";
import { getFarmProfile } from "../../api/farmApi";
import AppShell from "../../layouts/AppShell";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function FPOCommunityPage() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem("farmId") || "";
  const [activeTab, setActiveTab] = useState("shg");

  const [farmData, setFarmData] = useState(null);
  const [fpoData, setFpoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // SHG / Cost Splitter
  const [totalCost, setTotalCost] = useState(2500);
  const [splitMembers, setSplitMembers] = useState(5);
  const [sendingSplit, setSendingSplit] = useState(false);

  // Create SHG state
  const [showCreateSHG, setShowCreateSHG] = useState(false);
  const [shgName, setShgName] = useState("");
  const [creatingShg, setCreatingShg] = useState(false);

  // Invite member modal
  const [showInvite, setShowInvite] = useState(false);
  const [invitePhone, setInvitePhone] = useState("");

  // FPO join tender
  const [joiningTender, setJoiningTender] = useState(null);
  const [joinQty, setJoinQty] = useState("");

  // Create FPO
  const [showCreateFPO, setShowCreateFPO] = useState(false);
  const [fpoForm, setFpoForm] = useState({ name: "", registration_no: "", hubs: "" });
  const [creatingFpo, setCreatingFpo] = useState(false);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [farmRes, fpoRes] = await Promise.allSettled([
        getFarmProfile(farmId),
        getActiveFPO(),
      ]);
      if (farmRes.status === "fulfilled") setFarmData(farmRes.value.data);
      if (fpoRes.status === "fulfilled") setFpoData(fpoRes.value);
    } catch (e) {
      setError("Failed to load community data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSendSplitRequests = async () => {
    setSendingSplit(true);
    setTimeout(() => {
      alert(`Split request sent! Each of the ${splitMembers} members owes Rs.${(totalCost / splitMembers).toFixed(2)}.`);
      setSendingSplit(false);
    }, 1000);
  };

  const handleCreateSHG = async () => {
    if (!shgName.trim()) { alert("Enter a group name."); return; }
    setCreatingShg(true);
    try {
      await createShgGroup({ name: shgName, member_farm_ids: [farmId] });
      alert(`SHG "${shgName}" created! Share the invite link with members.`);
      setShowCreateSHG(false); setShgName(""); await fetchData();
    } catch (e) {
      alert("Failed to create SHG: " + (e.response?.data?.detail || e.message));
    } finally { setCreatingShg(false); }
  };

  const handleInviteMember = () => {
    if (!invitePhone.trim()) { alert("Enter a phone number."); return; }
    alert(`Invite sent to ${invitePhone} via SMS!`);
    setShowInvite(false); setInvitePhone("");
  };

  const handleJoinTender = async (tender) => {
    if (!joinQty || isNaN(parseFloat(joinQty)) || parseFloat(joinQty) <= 0) {
      alert("Enter a valid quantity."); return;
    }
    setJoiningTender(tender.id);
    try {
      await joinFpoTender(tender.id, { farm_id: farmId, quantity_qtl: parseFloat(joinQty) });
      alert(`Joined tender! You committed ${joinQty} Qtl.`);
      setJoiningTender(null); setJoinQty(""); await fetchData();
    } catch (e) {
      alert("Failed to join: " + (e.response?.data?.detail || e.message));
      setJoiningTender(null);
    }
  };

  const handleCreateFPO = async () => {
    if (!fpoForm.name.trim()) { alert("Enter FPO name."); return; }
    setCreatingFpo(true);
    try {
      const res = await createFpo(fpoForm);
      setFpoData(res); setShowCreateFPO(false);
      alert(`FPO "${fpoForm.name}" created successfully!`);
    } catch (e) {
      alert("Failed to create FPO: " + (e.response?.data?.detail || e.message));
    } finally { setCreatingFpo(false); }
  };

  const initials = (name) => name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) : "?";
  const farmerName = farmData?.owner_name || farmData?.name || "You";

  return (
    <AppShell title="Community & FPO" showBackButton>
      <main className="flex flex-col w-full pt-20 pb-24 px-margin bg-surface flex-1 gap-space-md">

        {/* Invite modal */}
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
            <div className="w-full max-w-md bg-surface rounded-t-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Invite Member</h3>
                <button type="button" onClick={() => setShowInvite(false)} className="material-symbols-outlined text-on-surface-variant">close</button>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Enter the phone number of the farmer you want to invite to your SHG.</p>
              <input type="tel" value={invitePhone} onChange={e => setInvitePhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-12 px-4 bg-surface-container rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary mb-3" />
              <button type="button" onClick={handleInviteMember}
                className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg font-bold flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">send</span>
                <span>Send Invite via SMS</span>
              </button>
            </div>
          </div>
        )}

        {/* Create FPO modal */}
        {showCreateFPO && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateFPO(false)}>
            <div className="w-full max-w-md bg-surface rounded-t-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Create New FPO</h3>
                <button type="button" onClick={() => setShowCreateFPO(false)} className="material-symbols-outlined text-on-surface-variant">close</button>
              </div>
              <div className="flex flex-col gap-3">
                <input type="text" value={fpoForm.name} onChange={e => setFpoForm(p => ({...p, name: e.target.value}))}
                  placeholder="FPO Name (e.g. Nashik Agri FPO)" className="w-full h-12 px-4 bg-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                <input type="text" value={fpoForm.registration_no} onChange={e => setFpoForm(p => ({...p, registration_no: e.target.value}))}
                  placeholder="Registration No." className="w-full h-12 px-4 bg-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                <input type="text" value={fpoForm.hubs} onChange={e => setFpoForm(p => ({...p, hubs: e.target.value}))}
                  placeholder="Hub locations (e.g. Nashik, Pune)" className="w-full h-12 px-4 bg-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                <button type="button" onClick={handleCreateFPO} disabled={creatingFpo}
                  className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                  {creatingFpo ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : null}
                  <span>{creatingFpo ? "Creating..." : "Create FPO"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Community &amp; FPO Hub</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            {farmData?.name ? `${farmData.name} — ` : ""}Form SHGs and FPOs for collective bargaining power
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-surface-container-high rounded-full">
          {[["shg", "group", "My SHG"], ["fpo", "factory", "FPO Network"]].map(([val, icon, label]) => (
            <button key={val} type="button" onClick={() => setActiveTab(val)}
              className={`flex-1 h-10 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all ${activeTab === val ? "bg-primary text-on-primary font-bold shadow-sm" : "text-on-surface-variant"}`}>
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <span className="material-symbols-outlined animate-spin text-primary text-[40px]">progress_activity</span>
          </div>
        )}

        {/* === SHG TAB === */}
        {!loading && activeTab === "shg" && (
          <>
            {/* My SHG Card */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-primary/5 p-space-md border-b border-surface-container-high flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">handshake</span>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {farmData?.district ? `${farmData.district} Farmers SHG` : "My Self-Help Group"}
                    </h2>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {farmId ? `ID: ${farmId.slice(0,8).toUpperCase()}` : "No ID"}
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full font-bold">Active</span>
              </div>

              <div className="p-space-md flex flex-col gap-2">
                {/* You (the logged in farmer) */}
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0">
                      {initials(farmerName)}
                    </div>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">{farmerName} (You)</span>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{farmData?.district || "Your District"}</p>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary font-bold bg-primary-fixed px-2 py-0.5 rounded-full">Lead</span>
                </div>

                {/* Invite more members placeholder */}
                <div className="text-center p-3 text-on-surface-variant font-body-sm text-body-sm">
                  Invite nearby farmers to join your SHG for collective purchasing power.
                </div>

                <button type="button" onClick={() => setShowInvite(true)}
                  className="w-full h-11 border-2 border-dashed border-primary/40 rounded-xl text-primary font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors active:scale-[0.98]">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Invite Member
                </button>
              </div>
            </div>

            {/* Cost Splitter */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-md">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">calculate</span>
                Shared Cost Splitter
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Split machinery rental or bulk seed orders across SHG members.</p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Total Booking Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-headline-sm">Rs.</span>
                    <input type="number" value={totalCost} onChange={e => setTotalCost(Number(e.target.value))}
                      className="w-full h-14 pl-12 pr-4 bg-surface-container rounded-xl font-headline-sm text-headline-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-label-sm text-label-sm text-on-surface-variant">Split Among Members</label>
                    <span className="font-label-md text-label-md text-primary font-bold">{splitMembers} members</span>
                  </div>
                  <input type="range" min="2" max="20" value={splitMembers} onChange={e => setSplitMembers(Number(e.target.value))}
                    className="w-full accent-primary" />
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant">Cost per Member</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    Rs.{(totalCost / splitMembers).toFixed(2)}
                  </span>
                </div>

                <button type="button" onClick={handleSendSplitRequests} disabled={sendingSplit}
                  className="w-full h-14 rounded-xl bg-secondary text-on-secondary font-label-lg font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 active:scale-[0.98] transition-transform">
                  {sendingSplit
                    ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Sending...</span></>
                    : <><span className="material-symbols-outlined text-[20px]">send</span><span>Send Split Requests to Members</span></>
                  }
                </button>
              </div>
            </div>

            {/* Create SHG */}
            {showCreateSHG ? (
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-md flex flex-col gap-3">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">New SHG Name</h3>
                <input type="text" value={shgName} onChange={e => setShgName(e.target.value)}
                  placeholder="e.g. Nashik Kisan SHG" className="w-full h-12 px-4 bg-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowCreateSHG(false)}
                    className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface font-label-md">Cancel</button>
                  <button type="button" onClick={handleCreateSHG} disabled={creatingShg}
                    className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-label-md font-bold disabled:opacity-60">
                    {creatingShg ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowCreateSHG(true)}
                className="w-full h-12 bg-surface-container rounded-xl text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 active:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-primary text-[20px]">add</span>
                Start a New SHG
              </button>
            )}
          </>
        )}

        {/* === FPO TAB === */}
        {!loading && activeTab === "fpo" && (
          <>
            {fpoData ? (
              <>
                {/* FPO Header */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/5 p-space-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-primary text-[22px]">factory</span>
                          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{fpoData.name}</h2>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Reg: {fpoData.registration_no} • {fpoData.members?.length || 0} members
                        </p>
                        {fpoData.hubs && (
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                            <span className="material-symbols-outlined text-[14px] align-middle">location_on</span> {fpoData.hubs}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-label-sm text-label-sm text-on-surface-variant">FPO Wallet</p>
                        <p className="font-headline-sm text-headline-sm text-primary font-bold">
                          Rs.{(fpoData.wallet_balance || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Members list */}
                  {fpoData.members && fpoData.members.length > 0 && (
                    <div className="p-space-md border-t border-surface-container-high">
                      <h3 className="font-label-md text-label-md text-on-surface-variant font-semibold uppercase tracking-wider mb-3">Members</h3>
                      <div className="flex flex-col gap-2">
                        {fpoData.members.slice(0, 5).map((m, i) => (
                          <div key={m.id || i} className="flex items-center justify-between p-2.5 bg-surface-container rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold text-xs flex-shrink-0">
                                {initials(m.member_name || "?")}
                              </div>
                              <div>
                                <p className="font-label-md text-label-md text-on-surface">{m.member_name || "Member"}</p>
                                {m.pooled_quantity > 0 && (
                                  <p className="font-label-sm text-label-sm text-on-surface-variant">{m.pooled_quantity} Qtl {m.crop_type || ""}</p>
                                )}
                              </div>
                            </div>
                            {m.tag && (
                              <span className="font-label-sm text-label-sm text-primary bg-primary-fixed px-2 py-0.5 rounded-full">{m.tag}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Tenders */}
                {fpoData.tenders && fpoData.tenders.length > 0 && (
                  <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-md">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-md flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">package_2</span>
                      Active Bulk Pools
                    </h3>
                    <div className="flex flex-col gap-3">
                      {fpoData.tenders.map((t, i) => {
                        const pct = t.target_qty > 0 ? Math.min(100, Math.round((t.current_pooled / t.target_qty) * 100)) : 0;
                        const isJoining = joiningTender === t.id;
                        return (
                          <div key={t.id || i} className="border border-surface-container-high rounded-xl p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-label-md text-label-md text-on-surface font-semibold">{t.crop_name || t.tender_type || "Bulk Pool"}</p>
                                {t.rate_offered > 0 && (
                                  <span className="font-label-sm text-label-sm text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                                    Rs.{t.rate_offered}/Qtl
                                  </span>
                                )}
                              </div>
                              <span className="font-label-sm text-label-sm text-secondary font-bold">{pct}% filled</span>
                            </div>
                            <div className="w-full bg-surface-container rounded-full h-2 mb-2 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
                              {t.current_pooled || 0} / {t.target_qty || "?"} Qtl aggregated
                            </p>
                            {isJoining ? (
                              <div className="flex gap-2">
                                <input type="number" value={joinQty} onChange={e => setJoinQty(e.target.value)}
                                  placeholder="Qty (Qtl)" className="flex-1 h-10 px-3 bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                                <button type="button" onClick={() => handleJoinTender(t)}
                                  className="h-10 px-4 bg-primary text-on-primary rounded-lg font-label-sm font-bold">Join</button>
                                <button type="button" onClick={() => setJoiningTender(null)}
                                  className="h-10 px-4 bg-surface-container text-on-surface rounded-lg font-label-sm">Cancel</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => { setJoiningTender(t.id); setJoinQty(""); }}
                                className="w-full h-10 border border-primary/40 text-primary font-label-md font-semibold rounded-lg hover:bg-primary/5 transition-colors">
                                Commit Quantity
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {fpoData.tenders?.length === 0 && (
                  <div className="bg-surface-container-lowest rounded-2xl p-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] mb-2 block">inventory_2</span>
                    <p className="font-label-md text-label-md">No active tenders yet.</p>
                    <p className="font-body-sm text-body-sm">FPO administrators can create bulk purchase/sale pools.</p>
                  </div>
                )}
              </>
            ) : (
              /* No FPO yet */
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[40px]">factory</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">No FPO Found</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-xs">
                    Join or create a Farmer Producer Organization to unlock collective bulk purchasing and pooled selling.
                  </p>
                </div>
                <button type="button" onClick={() => setShowCreateFPO(true)}
                  className="h-12 px-6 bg-primary text-on-primary rounded-xl font-label-lg font-bold flex items-center gap-2 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Create New FPO
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
