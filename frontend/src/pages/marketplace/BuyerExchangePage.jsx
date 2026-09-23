import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function BuyerExchangePage() {
  const navigate = useNavigate();
  const [buyerId, setBuyerId] = useState('BUY-999');
  const [formData, setFormData] = useState({
    crop: 'wheat',
    qty_needed_kg: 5000,
    quality_grade: 'A',
    price_offered: 2100
  });

  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [error, setError] = useState('');
  
  const wsRef = useRef(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // WebSocket connection for real-time B2B matching updates
    const wsUrl = API_BASE.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/api/v1/marketplace/ws/${buyerId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to real-time marketplace (Buyer Exchange)');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Real-time event received:", message);
        if (message.type === 'EXCHANGE_MATCH' || message.type === 'NEW_OFFER') {
          // In a real scenario, this would update the match dynamically
          setToastMessage(`New B2B supply offer detected for ${formData.crop}!`);
          setTimeout(() => setToastMessage(''), 5000);
        }
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected (Buyer Exchange)');
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [buyerId, formData.crop]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitRequirement = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const reqPayload = {
        buyer_id: buyerId,
        ...formData,
        qty_needed_kg: parseFloat(formData.qty_needed_kg),
        price_offered: parseFloat(formData.price_offered)
      };
      const reqRes = await axios.post(`${API_BASE}/api/v1/marketplace/buyer-requirement`, reqPayload);
      const matchRes = await axios.post(`${API_BASE}/api/v1/marketplace/exchange-match`, {
        buyer_requirement_id: reqRes.data.id
      });
      setMatchResult(matchRes.data);
      
    } catch (err) {
      setError('Failed to process buyer requirement match. Ensure backend is running and model is loaded.');
    } finally {
      setLoading(false);
    }
  };

  // Progress calculations
  const percentFilled = matchResult ? Math.min(100, (matchResult.aggregated_qty_kg / Number(formData.qty_needed_kg)) * 100) : 0;

  return (
    <AppShell 
      headerSlot={
        <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-14 px-margin flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs min-w-0 flex-1">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface"
                aria-label="Go back">
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <img alt="Brand logo" className="h-8 w-auto object-contain flex-shrink-0 hidden sm:block" src="https://lh3.googleusercontent.com/aida/AEtjO1UIQkciQWmlsTRY8f9Zy0F8V6Ui5SnL-bNI1XODjLR9sQNG4BHGAMrtvwAK-8Il7hBixSfzotAqt-1yzxZ1tS8lfeStHMZMcAAazASvjFxGLljEzJwhmT37IQLEv0u0wChglbOYjrW80Tbxp2N5Gci7RSN8sqPVnTp66_kG_QHJe8HBtzy0s7YivFGLy5OK6W6ahvWh_DtV3OjnAKUT1Zgj0Ae4r9TLabB2OQOypc-WO4bS3YHevJEUIf8"/>
              <div className="flex flex-col min-w-0 ml-1">
                <div className="flex items-center gap-1">
                  <span className="font-headline-sm text-headline-sm text-primary truncate leading-tight">KhetSaathi</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate hidden sm:inline">• B2B Exchange</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-space-xs flex-shrink-0">
              <div className="flex items-center gap-1 bg-surface-container-high px-space-xs py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-primary-container inline-block"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Synced</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">domain</span>
              </div>
            </div>
          </div>
        </header>
      }
    >
      <main className="flex flex-col w-full pt-24 pb-safe bg-background px-margin gap-space-md min-h-screen">
        
        {toastMessage && (
          <div className="bg-tertiary-container text-on-tertiary-container p-3 rounded-lg font-body-sm shadow-sm flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-[18px]">sensors</span>
            <p>{toastMessage}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 mt-space-sm">
          <div className="flex items-center bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 shadow-inner">
             <span className="font-label-sm text-on-surface-variant mr-2">Buyer ID:</span>
             <input
               value={buyerId} onChange={e => setBuyerId(e.target.value)}
               className="bg-transparent border-none outline-none w-24 font-mono font-bold text-primary"
             />
          </div>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-lg font-body-sm flex items-start gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
          
          {/* Post Requirement Form */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-space-md shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-space-md flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">storefront</span> 
              Post Demand
            </h2>
            
            <form onSubmit={submitRequirement} className="flex flex-col gap-space-sm">
              <div>
                <label className="block font-label-sm text-on-surface-variant mb-1">Target Crop</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">grass</span>
                  <input 
                    name="crop" value={formData.crop} onChange={handleInputChange} 
                    className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface capitalize font-body-md" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-label-sm text-on-surface-variant mb-1">Required Quantity (kg)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">scale</span>
                  <input 
                    type="number" name="qty_needed_kg" value={formData.qty_needed_kg} onChange={handleInputChange} 
                    className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface font-mono font-body-md" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="block font-label-sm text-on-surface-variant mb-1">Quality</label>
                  <select 
                    name="quality_grade" value={formData.quality_grade} onChange={handleInputChange} 
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface font-body-md"
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-on-surface-variant mb-1">Offer (₹/qtl)</label>
                  <input 
                    type="number" name="price_offered" value={formData.price_offered} onChange={handleInputChange} 
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface font-mono font-body-md" 
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full mt-2 bg-primary hover:bg-primary/90 text-on-primary font-label-lg py-3 px-4 rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">hub</span>}
                Find Farmer Clusters
              </button>
            </form>
          </div>

          {/* Matching Results */}
          <div className="lg:col-span-2">
            {!matchResult ? (
               <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-on-surface-variant border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest/50 p-6 text-center">
                 <span className="material-symbols-outlined text-[64px] mb-4 opacity-50 text-secondary">handshake</span>
                 <p className="font-headline-sm font-bold text-on-surface mb-2">No Active Requirements</p>
                 <p className="font-body-md max-w-sm">Submit your demand criteria to run our Bipartite Matching algorithm against registered farmer yields.</p>
               </div>
            ) : (
              <div className="bg-surface-container-lowest border border-primary/30 rounded-2xl p-space-md shadow-md relative">
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-mono text-primary border border-primary/30 rounded px-1.5 py-0.5 bg-primary-container text-on-primary-container font-bold uppercase tracking-wide">
                    {matchResult.model_type || 'Bipartite Match'}
                  </span>
                </div>
                
                <h2 className="font-headline-sm text-headline-sm text-on-surface mb-space-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[28px]">handshake</span> 
                  Match Results
                </h2>

                <div className="mb-space-md bg-surface-container rounded-xl p-space-sm border border-outline-variant">
                  <div className="flex justify-between font-label-md text-on-surface mb-2">
                    <span className="text-on-surface-variant">Aggregated Volume</span>
                    <span className="font-bold">{matchResult.aggregated_qty_kg.toLocaleString()} / {formData.qty_needed_kg.toLocaleString()} kg</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-4 relative overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out"
                      style={{ width: `${percentFilled}%` }}
                    >
                    </div>
                  </div>
                  <div className="flex justify-between font-label-sm mt-2">
                    <span className="text-primary font-bold">Match Score: {(matchResult.match_score * 100).toFixed(1)}%</span>
                    <span className={`font-bold ${matchResult.status === 'PARTIAL_FILL' ? 'text-secondary' : 'text-primary'}`}>
                      {matchResult.status}
                    </span>
                  </div>
                </div>

                {/* Clustered Farms */}
                <div className="mt-space-md">
                  <h3 className="font-label-md text-on-surface-variant mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">groups</span>
                    Contributing Farm Clusters ({(matchResult.matched_farm_ids || matchResult.farm_ids || []).length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(matchResult.matched_farm_ids || matchResult.farm_ids || []).map(id => (
                      <div key={id} className="bg-surface-container border border-outline-variant px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                        <span className="font-label-sm font-mono text-on-surface">{id}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-space-lg pt-space-md border-t border-outline-variant flex justify-end">
                  <button className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-on-primary font-label-lg rounded-xl shadow-sm transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined">contract</span>
                    Execute Contract
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
