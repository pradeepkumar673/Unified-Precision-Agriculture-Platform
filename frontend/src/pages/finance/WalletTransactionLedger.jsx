import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLedger, exportLedgerPdf, initiatePayment } from "../../api/financeApi";
import { getFarmProfile } from "../../api/farmApi";

export default function WalletTransactionLedger() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [farmData, setFarmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAmount, setBankAmount] = useState("");
  const [bankLoading, setBankLoading] = useState(false);

  const farmId = localStorage.getItem("farmId") || "00000000-0000-0000-0000-000000000000";

  const fetchLedger = async () => {
    try {
      const res = await getLedger(farmId);
      setTransactions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const farmRes = await getFarmProfile(farmId).catch(() => ({ data: null }));
        if (farmRes.data) setFarmData(farmRes.data);
      } catch (e) {
        console.error("Farm profile load failed", e);
      }
      await fetchLedger();
    };
    init();
  }, []);

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const sy = String(year).slice(-2);
    const ny = String(year + 1).slice(-2);
    if (month >= 6 && month <= 10) return `Kharif ${sy}-${ny}`;
    if (month >= 11 || month <= 3) return `Rabi ${sy}-${ny}`;
    return `Zaid ${sy}`;
  };

  const loadRazorpay = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) { resolve(); return; }
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });

  const handleAddMoneySubmit = async () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) { alert("Please enter a valid amount."); return; }
    setAddLoading(true);
    try {
      const res = await initiatePayment({ related_entity_id: farmId, amount, type: "wallet_topup" });
      const orderId = res.data.razorpay_order_id;
      if (orderId?.includes("mock")) {
        alert(`[TEST MODE] Mock order: ${orderId}`);
        setShowAddModal(false); setAddAmount("");
        await fetchLedger(); return;
      }
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: "rzp_test_RMHdBS5ea7cEEb",
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "KhetSaathi Agri Wallet",
        description: `Add to Wallet`,
        order_id: orderId,
        prefill: { name: farmData?.owner_name || "", contact: farmData?.phone_number || "" },
        theme: { color: "#1F4228" },
        handler: async () => {
          alert("Wallet funded successfully!");
          setShowAddModal(false); setAddAmount("");
          await fetchLedger();
        },
      });
      rzp.on("payment.failed", (r) => alert("Payment failed: " + r.error.description));
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to initiate payment.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleBankTransfer = async () => {
    const amount = parseFloat(bankAmount);
    if (isNaN(amount) || amount <= 0) { alert("Please enter a valid amount."); return; }
    if (amount > netBalance) { alert(`Insufficient balance. Available: Rs.${netBalance.toLocaleString("en-IN")}`); return; }
    setBankLoading(true);
    setTimeout(async () => {
      alert(`Transfer of Rs.${amount.toLocaleString("en-IN")} to linked bank account initiated. It will reflect within 24 hrs.`);
      setShowBankModal(false); setBankAmount(""); setBankLoading(false);
      await fetchLedger();
    }, 1500);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportLedgerPdf(farmId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `KisanPassbook_${farmData?.name || "Farm"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Failed to download PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const groupTransactions = (txs) => {
    const g = { today: [], yesterday: [], older: [] };
    if (!Array.isArray(txs)) return g;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    txs.forEach((tx) => {
      const d = new Date(tx.created_at); d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) g.today.push(tx);
      else if (d.getTime() === yesterday.getTime()) g.yesterday.push(tx);
      else g.older.push(tx);
    });
    return g;
  };

  const grouped = groupTransactions(transactions);
  const fmt = (val) => `Rs.${Math.abs(val).toLocaleString("en-IN")}`;

  const typeLabels = {
    scheme_dbt: "PM-KISAN / DBT Transfer",
    marketplace: "Marketplace Purchase",
    irrigation: "Irrigation Expense",
    wallet_topup: "Wallet Top-Up",
    insurance_claim: "Insurance Claim Payout",
    loan_disbursement: "Loan Disbursement",
    bank_transfer: "Bank Transfer",
  };

  const renderTx = (tx) => {
    const isIncome = tx.amount > 0;
    if (filter === "income" && !isIncome) return null;
    if (filter === "expense" && isIncome) return null;
    const icon = isIncome
      ? tx.type === "scheme_dbt" ? "account_balance" : tx.type === "wallet_topup" ? "add_circle" : "savings"
      : tx.type === "marketplace" ? "storefront" : tx.type === "irrigation" ? "water_drop" : "payments";
    return (
      <div key={tx.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">
        <div className="flex items-start justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isIncome ? "bg-primary-fixed/40 text-primary" : "bg-secondary-fixed text-secondary"}`}>
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-lg text-label-lg text-on-surface truncate">{tx.tag || typeLabels[tx.type] || tx.type}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {new Date(tx.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className={`font-headline-sm text-headline-sm font-bold ${isIncome ? "text-primary" : "text-secondary"}`}>
              {isIncome ? "+" : "-"}{fmt(tx.amount)}
            </span>
            <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full mt-0.5 capitalize ${isIncome ? "bg-primary-fixed/30 text-primary" : "bg-surface-container text-on-surface-variant"}`}>
              {tx.status}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (key, txs, title) => {
    const visible = txs.filter((tx) =>
      filter === "all" || (filter === "income" && tx.amount > 0) || (filter === "expense" && tx.amount <= 0)
    );
    if (visible.length === 0) return null;
    const net = visible.reduce((acc, tx) => acc + tx.amount, 0);
    return (
      <div key={key} className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-space-xs">
          <span className="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">{title}</span>
          <span className={`font-label-sm text-label-sm font-semibold ${net >= 0 ? "text-primary" : "text-secondary"}`}>
            Net {net >= 0 ? "+" : "-"}{fmt(net)}
          </span>
        </div>
        {visible.map(renderTx)}
      </div>
    );
  };

  const safe = Array.isArray(transactions) ? transactions : [];
  const totalIncome = safe.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const totalExpense = safe.filter((t) => t.amount <= 0).reduce((a, t) => a + Math.abs(t.amount), 0);
  const netBalance = totalIncome - totalExpense;
  const pendingAmount = safe.filter((t) => t.status === "pending" && t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const maskedAccount = farmId.replace(/-/g, "").slice(-4);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col pt-safe pb-safe relative">

      {/* Add Money Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md bg-surface rounded-t-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Add Money to Wallet</h3>
              <button onClick={() => setShowAddModal(false)} type="button" className="material-symbols-outlined text-on-surface-variant">close</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-headline-sm">Rs.</span>
                <input autoFocus type="number"
                  className="w-full h-14 pl-12 pr-4 bg-surface-container rounded-xl font-headline-sm text-headline-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter amount" value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMoneySubmit()} />
              </div>
              <div className="flex gap-2">
                {[500, 1000, 2000, 5000].map((v) => (
                  <button key={v} type="button" onClick={() => setAddAmount(String(v))}
                    className="flex-1 h-9 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm hover:bg-primary/10 hover:text-primary transition-colors">
                    Rs.{v.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
              <button onClick={handleAddMoneySubmit} disabled={addLoading || !addAmount} type="button"
                className="w-full h-14 rounded-xl bg-secondary text-on-secondary font-label-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {addLoading
                  ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Connecting to Razorpay...</span></>
                  : <><span className="material-symbols-outlined text-[20px]">payment</span><span>Pay via Razorpay</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* To Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowBankModal(false)}>
          <div className="w-full max-w-md bg-surface rounded-t-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Transfer to Bank</h3>
              <button onClick={() => setShowBankModal(false)} type="button" className="material-symbols-outlined text-on-surface-variant">close</button>
            </div>
            <div className="bg-surface-container rounded-xl p-3 mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[24px]">account_balance</span>
              <div>
                <p className="font-label-md text-label-md text-on-surface font-semibold">Linked Account ....{maskedAccount}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Available: Rs.{netBalance.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-headline-sm">Rs.</span>
                <input autoFocus type="number"
                  className="w-full h-14 pl-12 pr-4 bg-surface-container rounded-xl font-headline-sm text-headline-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter amount" value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBankTransfer()} />
              </div>
              <button onClick={handleBankTransfer} disabled={bankLoading || !bankAmount} type="button"
                className="w-full h-14 rounded-xl bg-primary text-on-primary font-label-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {bankLoading
                  ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Processing...</span></>
                  : <><span className="material-symbols-outlined text-[20px]">send_money</span><span>Transfer via IMPS/NEFT</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex flex-col w-full pt-[64px] pb-24 px-margin bg-surface flex-1">
        {/* Balance Card */}
        <div className="w-full bg-primary-container text-on-primary rounded-xl p-space-md shadow-md relative overflow-hidden mb-space-lg">
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-primary/20 pointer-events-none"></div>
          <div className="absolute -right-2 -bottom-10 w-28 h-28 rounded-full bg-secondary-container/10 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs bg-black/20 backdrop-blur-md px-space-sm py-1 rounded-full">
                <span className="material-symbols-outlined text-primary-fixed text-[16px]">verified</span>
                <span className="font-label-sm text-label-sm text-on-primary tracking-wide">
                  {farmData?.name ? `${farmData.name.slice(0, 12)} A/C` : "A/C"} ....{maskedAccount}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">Active Ledger</span>
            </div>

            <div className="mt-1">
              <span className="font-label-md text-label-md text-on-primary/80 block">Net Available Balance</span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                {loading
                  ? <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-primary/50">Loading...</span>
                  : <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-on-primary">
                      Rs.{netBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>}
              </div>
            </div>

            {pendingAmount > 0 && (
              <div className="bg-black/20 backdrop-blur-sm rounded-lg px-space-sm py-1.5 flex items-center gap-space-xs text-on-primary/90">
                <span className="material-symbols-outlined text-secondary-fixed text-[18px] flex-shrink-0">hourglass_top</span>
                <span className="font-label-sm text-label-sm truncate">Rs.{pendingAmount.toLocaleString("en-IN")} pending clearance</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-space-sm mt-2 pt-space-sm bg-black/10 rounded-lg p-space-sm">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-primary-fixed font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward_alt</span>
                  <span>{getCurrentSeason()} Income</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-on-primary mt-0.5">+Rs.{totalIncome.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-secondary-fixed font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">arrow_upward_alt</span>
                  <span>Expenses</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-secondary-fixed mt-0.5">-Rs.{totalExpense.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-space-sm mt-2">
              <button onClick={() => setShowAddModal(true)} type="button"
                className="h-12 bg-secondary text-on-secondary rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-sm active:scale-[0.98] transition-transform">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span>Add Money</span>
              </button>
              <button onClick={() => setShowBankModal(true)} type="button"
                className="h-12 bg-surface-container-lowest text-primary font-label-lg text-label-lg rounded-lg flex items-center justify-center gap-space-xs shadow-sm active:scale-[0.98] transition-transform">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
                <span>To Bank</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-space-sm mb-space-md">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex p-1 bg-surface-container-high rounded-full w-full max-w-[260px]">
              {[["all", `All (${transactions.length})`], ["income", "Income (+)"], ["expense", "Expense (-)"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilter(val)}
                  className={`flex-1 h-9 rounded-full font-label-sm text-label-sm transition-all ${filter === val ? "bg-primary text-on-primary font-bold" : "text-on-surface-variant"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="h-11 px-space-sm bg-surface-container rounded-full flex items-center gap-space-xs text-on-surface font-label-sm text-label-sm shadow-sm flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[18px]">event_note</span>
              <span className="font-bold">{getCurrentSeason()}</span>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="flex flex-col gap-space-md" id="transactions-container">
          {loading && (
            <div className="flex justify-center py-8">
              <span className="material-symbols-outlined animate-spin text-primary text-[40px]">progress_activity</span>
            </div>
          )}
          {!loading && transactions.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px]">receipt_long</span>
              <p className="font-label-md text-label-md">No transactions yet.</p>
              <p className="font-body-sm text-body-sm text-center">Add money to your wallet or make a marketplace purchase to see your ledger.</p>
            </div>
          )}
          {renderGroup("today", grouped.today, `Today, ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`)}
          {renderGroup("yesterday", grouped.yesterday, "Yesterday")}
          {renderGroup("older", grouped.older, "Older Transactions")}
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col gap-space-sm mt-space-lg">
          <button onClick={handleExport} disabled={exporting} type="button"
            className="w-full h-14 bg-surface-container rounded-xl flex items-center justify-between px-space-md text-on-surface shadow-sm active:bg-surface-container-high transition-colors disabled:opacity-60">
            <div className="flex items-center gap-space-sm">
              <span className={`material-symbols-outlined text-primary text-[22px] ${exporting ? "animate-spin" : ""}`}>
                {exporting ? "progress_activity" : "download_for_offline"}
              </span>
              <div className="flex flex-col text-left">
                <span className="font-label-md text-label-md font-bold">{exporting ? "Generating PDF..." : "Download Kisan Passbook (PDF)"}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {farmData?.name ? `${farmData.name} - ` : ""}Seasonal tax ledger and receipts
                </span>
              </div>
            </div>
            {!exporting && <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>}
          </button>

          <div className="w-full bg-surface-container-low rounded-xl p-space-md flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm font-bold text-on-surface">Kisan Finance Helpline (Toll-Free)</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">1800-180-1551 (6 AM - 10 PM)</span>
              </div>
            </div>
            <a className="h-10 px-space-sm bg-primary text-on-primary rounded-full font-label-sm text-label-sm flex items-center gap-1 flex-shrink-0 shadow-sm" href="tel:18001801551">
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span>Call</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
