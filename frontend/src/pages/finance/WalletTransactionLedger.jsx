import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLedger, exportLedgerPdf, initiatePayment } from '../../api/financeApi';

export default function WalletTransactionLedger() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      const res = await getLedger(farmId);
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleAddMoney = async () => {
    const input = window.prompt("Enter amount to add to Wallet (₹):", "5000");
    if (!input) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount.");
      return;
    }
    
    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      const res = await initiatePayment({
        related_entity_id: farmId,
        amount: amount,
        type: 'scheme_dbt' // Using a type that represents incoming funds
      });
      
      const orderId = res.data.razorpay_order_id;
      if (orderId?.includes('mock')) {
        alert(`[TEST MODE] Mock order created: ${orderId}\nTransaction ID: ${res.data.transaction_id}`);
        fetchLedger();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: "rzp_test_RMHdBS5ea7cEEb", // Real Razorpay Key
          amount: Math.round(amount * 100),
          currency: "INR",
          name: "KhetSaathi Agri Wallet",
          description: "Add Money to Wallet",
          order_id: res.data.razorpay_order_id,
          handler: function (response) {
            console.log("Payment Successful", response);
            alert('Wallet funded successfully!');
            fetchLedger();
          },
          theme: {
            color: "#1F4228"
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
          alert('Payment Failed: ' + response.error.description);
        });
        rzp.open();
      };
      script.onerror = () => alert('Failed to load Razorpay SDK');
      document.body.appendChild(script);
      
    } catch (err) {
      alert(err.response?.data?.detail || 'Razorpay initialization failed.');
    }
  };

  const handleExport = async () => {
    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      const res = await exportLedgerPdf(farmId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Kisan_Passbook.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  const groupTransactions = (txs) => {
    const grouped = { today: [], yesterday: [], older: [] };
    if (!Array.isArray(txs)) return grouped;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    txs.forEach(tx => {
      const txDate = new Date(tx.created_at);
      txDate.setHours(0, 0, 0, 0);
      if (txDate.getTime() === today.getTime()) {
        grouped.today.push(tx);
      } else if (txDate.getTime() === yesterday.getTime()) {
        grouped.yesterday.push(tx);
      } else {
        grouped.older.push(tx);
      }
    });
    return grouped;
  };

  const grouped = groupTransactions(transactions);

  const calculateNet = (txs) => txs.reduce((acc, tx) => acc + tx.amount, 0);

  const formatAmount = (val) => `₹${Math.abs(val).toLocaleString('en-IN')}`;

  const renderTransaction = (tx) => {
    const isIncome = tx.amount > 0;
    if (filter === 'income' && !isIncome) return null;
    if (filter === 'expense' && isIncome) return null;

    const icon = isIncome ? 'account_balance' : (tx.type === 'marketplace' ? 'precision_manufacturing' : 'water_drop');
    const bgClass = isIncome ? 'bg-primary-fixed/40 text-primary' : 'bg-secondary-fixed text-secondary';
    const amountColor = isIncome ? 'text-primary' : 'text-secondary';
    const tagBg = isIncome ? 'bg-primary-fixed/30 text-primary' : 'bg-surface-container text-on-surface-variant';
    const sign = isIncome ? '+' : '-';

    return (
      <div key={tx.id} className={`transaction-item ${isIncome ? 'income' : 'expense'} bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs`}>
        <div className="flex items-start justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass}`}>
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-lg text-label-lg text-on-surface truncate">{tx.tag || tx.type}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{tx.related_entity_id}</span>
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className={`font-headline-sm text-headline-sm font-bold ${amountColor}`}>{sign}{formatAmount(tx.amount)}</span>
            <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full mt-0.5 ${isIncome ? 'font-bold' : ''} ${tagBg}`}>
              {tx.status}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (key, txs, title) => {
    const visibleTxs = txs.filter(tx => filter === 'all' || (filter === 'income' && tx.amount > 0) || (filter === 'expense' && tx.amount <= 0));
    if (visibleTxs.length === 0) return null;

    const net = calculateNet(visibleTxs);
    const isNetPositive = net >= 0;

    return (
      <div key={key} className="flex flex-col gap-space-sm transaction-group" data-date={key}>
        <div className="flex items-center justify-between px-space-xs">
          <span className="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">{title}</span>
          <span className={`font-label-sm text-label-sm font-semibold ${isNetPositive ? 'text-primary' : 'text-secondary'}`}>
            Net {isNetPositive ? '+' : '-'}{formatAmount(net)}
          </span>
        </div>
        {visibleTxs.map(renderTransaction)}
      </div>
    );
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const totalIncome = safeTransactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = safeTransactions.filter(t => t.amount <= 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col pt-safe pb-safe relative">
      

      <main className="flex flex-col w-full pt-[64px] pb-24 px-margin bg-surface flex-1">
        <div className="w-full bg-primary-container text-on-primary rounded-xl p-space-md shadow-md relative overflow-hidden mb-space-lg">
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-primary/20 pointer-events-none"></div>
          <div className="absolute -right-2 -bottom-10 w-28 h-28 rounded-full bg-secondary-container/10 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs bg-black/20 backdrop-blur-md px-space-sm py-1 rounded-full">
                <span className="material-symbols-outlined text-primary-fixed text-[16px]">verified</span>
                <span className="font-label-sm text-label-sm text-on-primary tracking-wide">SBI A/C ••••4891</span>
              </div>
              <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">Active Ledger</span>
            </div>
            
            <div className="mt-1">
              <span className="font-label-md text-label-md text-on-primary/80 block">Net Available Balance</span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-on-primary">₹{netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-space-sm py-1.5 flex items-center gap-space-xs text-on-primary/90">
              <span className="material-symbols-outlined text-secondary-fixed text-[18px] flex-shrink-0">hourglass_top</span>
              <span className="font-label-sm text-label-sm truncate">₹145,200 pending mandi buyer clearance</span>
            </div>
            
            <div className="grid grid-cols-2 gap-space-sm mt-2 pt-space-sm bg-black/10 rounded-lg p-space-sm">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-primary-fixed font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward_alt</span>
                  <span>Rabi Income</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-on-primary mt-0.5">+₹{totalIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-secondary-fixed font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">arrow_upward_alt</span>
                  <span>Expenses</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-secondary-fixed mt-0.5">-₹{totalExpense.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-space-sm mt-2">
              <button onClick={handleAddMoney} className="h-12 bg-secondary text-on-secondary rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-sm active:scale-[0.98] transition-transform">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span>Add Money</span>
              </button>
              <button className="h-12 bg-surface-container-lowest text-primary font-label-lg text-label-lg rounded-lg flex items-center justify-center gap-space-xs shadow-sm active:scale-[0.98] transition-transform">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
                <span>To Bank</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-space-sm mb-space-md">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex p-1 bg-surface-container-high rounded-full w-full max-w-[260px]">
              <button 
                onClick={() => setFilter('all')} 
                className={`flex-1 h-9 rounded-full font-label-sm text-label-sm transition-all ${filter === 'all' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'}`}
              >
                All ({transactions.length})
              </button>
              <button 
                onClick={() => setFilter('income')} 
                className={`flex-1 h-9 rounded-full font-label-sm text-label-sm transition-all ${filter === 'income' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'}`}
              >
                Income (+)
              </button>
              <button 
                onClick={() => setFilter('expense')} 
                className={`flex-1 h-9 rounded-full font-label-sm text-label-sm transition-all ${filter === 'expense' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'}`}
              >
                Expense (-)
              </button>
            </div>
            <button className="h-11 px-space-sm bg-surface-container rounded-full flex items-center gap-space-xs text-on-surface font-label-sm text-label-sm shadow-sm flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[18px]">event_note</span>
              <span className="font-bold">Rabi 24-25</span>
              <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-space-md" id="transactions-container">
          {transactions.length === 0 && !loading && (
            <div className="text-center p-space-lg text-on-surface-variant font-label-md">
              No transactions found.
            </div>
          )}
          {renderGroup('today', grouped.today, `Today, ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`)}
          {renderGroup('yesterday', grouped.yesterday, 'Yesterday')}
          {renderGroup('older', grouped.older, 'Older')}
        </div>

        <div className="flex flex-col gap-space-sm mt-space-lg">
          <button onClick={handleExport} className="w-full h-14 bg-surface-container rounded-xl flex items-center justify-between px-space-md text-on-surface shadow-sm active:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[22px]">download_for_offline</span>
              <div className="flex flex-col text-left">
                <span className="font-label-md text-label-md font-bold">Download Kisan Passbook (PDF)</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Includes seasonal tax ledger and receipts</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
          
          <div className="w-full bg-surface-container-low rounded-xl p-space-md flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm font-bold text-on-surface">Kisan Finance Helpline (Toll-Free)</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">1800-180-1551 (6 AM – 10 PM)</span>
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
