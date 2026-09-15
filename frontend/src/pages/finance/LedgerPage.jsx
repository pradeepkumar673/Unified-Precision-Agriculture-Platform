import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, ShieldAlert, CheckCircle, Clock, Lock,
  Download, ArrowUpRight, ArrowDownLeft, ShieldCheck
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function LedgerPage() {
  const [farmId, setFarmId] = useState('FARM-001');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [fraudLoading, setFraudLoading] = useState(null);
  const [error, setError] = useState('');

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/v1/finance/ledger/${farmId}`);
      setTransactions(res.data);
      setError('');
    } catch (err) {
      setTransactions([]);
      setError(err.response?.data?.detail || 'Unable to load the ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [farmId]);

  const initiatePayment = async (txn) => {
    try {
      // In reality, you'd pass related_entity_id. For demo, we just trigger checkout.
      const res = await axios.post(`${API_BASE}/api/v1/finance/payment/initiate`, {
        related_entity_id: txn.id,
        amount: txn.amount,
        type: txn.category
      });
      // Assuming Razorpay link is returned
      if (res.data.checkout_url) {
        window.open(res.data.checkout_url, '_blank');
      } else {
        setError('Razorpay did not return a checkout URL.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Razorpay payment initialization failed.');
    }
  };

  const runFraudCheck = async (txnId) => {
    setFraudLoading(txnId);
    try {
      const res = await axios.post(`${API_BASE}/api/v1/finance/fraud-check`, { transaction_id: txnId });
      setTransactions(prev => prev.map(t => 
        t.id === txnId ? { ...t, flagged: res.data.flagged, anomaly_score: res.data.anomaly_score } : t
      ));
    } catch (err) {
      setError(err.response?.data?.detail || 'Fraud check failed.');
    } finally {
      setFraudLoading(null);
    }
  };

  const downloadPDF = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/v1/finance/ledger/${farmId}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ledger-${farmId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to download the ledger statement.');
    }
  };

  const renderStatusPill = (status) => {
    switch (status) {
      case 'released':
        return <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-semibold"><CheckCircle className="w-3 h-3"/> Released</span>;
      case 'escrow_held':
        return <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded text-xs font-semibold"><Lock className="w-3 h-3"/> Escrow</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-xs font-semibold"><Clock className="w-3 h-3"/> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Escrow & Ledger
          </h1>
          <p className="text-slate-400 mt-1">Smart contract escrow tracking and AI anomaly detection</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
             <span className="text-sm text-slate-400 px-2">Farm ID:</span>
             <input
               value={farmId} onChange={e => setFarmId(e.target.value)} onBlur={fetchLedger}
               className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-32 text-white font-mono"
             />
          </div>
          <button 
            onClick={downloadPDF}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5"/> <span className="text-sm font-medium hidden sm:block">Statement</span>
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700">
                <th className="p-4 text-slate-400 font-semibold text-sm">Transaction ID</th>
                <th className="p-4 text-slate-400 font-semibold text-sm">Date</th>
                <th className="p-4 text-slate-400 font-semibold text-sm">Category</th>
                <th className="p-4 text-slate-400 font-semibold text-sm">Amount</th>
                <th className="p-4 text-slate-400 font-semibold text-sm">Status</th>
                <th className="p-4 text-slate-400 font-semibold text-sm">Security</th>
                <th className="p-4 text-slate-400 font-semibold text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-500">Loading ledger...</td></tr>
              ) : transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-mono text-sm text-white">{txn.id}</td>
                  <td className="p-4 text-sm text-slate-400">{new Date(txn.date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-slate-300 capitalize">{txn.category.replace('_', ' ')}</td>
                  <td className="p-4 font-bold text-white flex items-center gap-1 mt-1">
                    {txn.type === 'Credit' ? <ArrowDownLeft className="w-4 h-4 text-emerald-400"/> : <ArrowUpRight className="w-4 h-4 text-red-400"/>}
                    ₹{txn.amount.toLocaleString()}
                  </td>
                  <td className="p-4">{renderStatusPill(txn.status)}</td>
                  <td className="p-4">
                    {txn.flagged ? (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold bg-red-500/10 px-2 py-1 rounded border border-red-500/30">
                        <ShieldAlert className="w-3.5 h-3.5" /> High Risk ({txn.anomaly_score?.toFixed(2)})
                      </span>
                    ) : txn.anomaly_score !== undefined ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <button 
                        onClick={() => runFraudCheck(txn.id)} disabled={fraudLoading === txn.id}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
                      >
                        {fraudLoading === txn.id ? 'Checking...' : 'Run AML Check'}
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {txn.status === 'pending' && txn.type === 'Debit' && (
                      <button 
                        onClick={() => initiatePayment(txn)}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-md shadow-lg shadow-blue-500/20 transition-colors"
                      >
                        Pay via Razorpay
                      </button>
                    )}
                    {txn.status === 'escrow_held' && (
                      <span className="text-xs text-slate-500 italic">Awaiting delivery</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
