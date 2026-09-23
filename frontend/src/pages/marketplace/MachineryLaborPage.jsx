import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';

export default function MachineryLaborPage() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const [activeTab, setActiveTab] = useState('machinery'); // 'machinery' or 'labor'
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [error, setError] = useState('');

  const [machineryList, setMachineryList] = useState([]);
  const [laborGangs, setLaborGangs] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    const fetchListings = async () => {
      try {
        const endpoint = activeTab === 'machinery' ? 'equipment' : 'labor';
        const res = await axios.get(`${API_BASE}/api/v1/marketplace/${endpoint}`);
        if (activeTab === 'machinery') {
          setMachineryList(res.data);
        } else {
          setLaborGangs(res.data);
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Unable to load rental listings.');
      }
    };
    fetchListings();
  }, [activeTab, API_BASE]);

  useEffect(() => {
    // WebSocket connection for real-time updates
    const wsUrl = API_BASE.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/api/v1/marketplace/ws/${farmId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to real-time marketplace (Rentals)');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Real-time event received:", message);
        if (message.type === 'NEW_EQUIPMENT') {
          setMachineryList(prev => [message.data, ...prev]);
        } else if (message.type === 'NEW_LABOR') {
          setLaborGangs(prev => [message.data, ...prev]);
        }
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected (Rentals)');
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [farmId, API_BASE]);

  const handleBook = async (item) => {
    setBookingLoading(item.id);
    setError('');
    
    try {
      const endpoint = activeTab === 'machinery' ? 'equipment/book' : 'labor/book';
      const payload = activeTab === 'machinery' 
        ? { listing_id: item.id, farm_id: farmId, start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] }
        : { listing_id: item.id, farm_id: farmId, task_type: 'General', date: new Date().toISOString().split('T')[0] };

      const res = await axios.post(`${API_BASE}/api/v1/marketplace/${endpoint}`, payload);
      
      setBookingSuccess({
        id: item.id,
        name: item.equipment_type || item.skill || 'Rental',
        eta: res.data?.assigned_route_eta || 'Confirmed'
      });
      setTimeout(() => setBookingSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed.');
    } finally {
      setBookingLoading(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

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
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate hidden sm:inline">• Rentals</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-space-xs flex-shrink-0">
              <div className="flex items-center gap-1 bg-surface-container-high px-space-xs py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-primary-container inline-block"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Synced</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>
      }
    >
      <main className="flex flex-col w-full pt-24 pb-safe bg-background px-margin gap-space-md min-h-screen">
        
        {/* Toggle Tabs */}
        <div className="flex w-full bg-surface-container-low rounded-xl p-1 shadow-inner mt-space-sm">
          <button
            onClick={() => setActiveTab('machinery')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg font-label-md text-label-md transition-colors ${activeTab === 'machinery' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[20px]">agriculture</span>
            Machinery
          </button>
          <button
            onClick={() => setActiveTab('labor')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg font-label-md text-label-md transition-colors ${activeTab === 'labor' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[20px]">groups</span>
            Labor Gangs
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant focus-within:border-primary transition-colors relative overflow-hidden">
             <span className="material-symbols-outlined text-on-surface-variant absolute left-4">search</span>
             <input type="text" placeholder={`Search ${activeTab}...`} className="bg-transparent border-none outline-none pl-8 w-full text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant" />
          </div>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-lg font-body-sm text-body-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
            <p>{error}</p>
          </div>
        )}

        {bookingSuccess && (
          <div className="bg-primary-container text-on-primary-container p-4 rounded-xl flex items-start gap-3 shadow-sm border border-primary/20 animate-fade-in">
            <span className="material-symbols-outlined text-[24px] text-primary">check_circle</span>
            <div>
              <p className="font-label-lg font-bold">Booking Confirmed</p>
              <p className="font-body-md mt-1">Your request for {bookingSuccess.name} is confirmed.</p>
              <p className="font-body-sm mt-1 opacity-80 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">route</span>
                ETA: {bookingSuccess.eta} mins (OR-Tools Routing)
              </p>
            </div>
          </div>
        )}

        {/* Listings */}
        <div className="flex flex-col gap-space-sm pb-16">
          {(activeTab === 'machinery' ? machineryList : laborGangs).map((item, idx) => (
            <article key={item.id || idx} className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant flex flex-col gap-space-sm">
              <div className="flex justify-between items-start gap-space-sm">
                <div className="flex gap-space-sm flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${activeTab === 'machinery' ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                    {activeTab === 'machinery' ? (
                      <span className="material-symbols-outlined text-[28px]">agriculture</span>
                    ) : (
                      <span className="material-symbols-outlined text-[28px]">groups</span>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                      {activeTab === 'machinery' ? item.equipment_type : item.skill}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 truncate mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">storefront</span>
                      {activeTab === 'machinery' ? item.owner_id : item.gang_id}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container-highest text-on-surface-variant">
                         {item.available !== false ? 'Available' : 'Booked'}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                   <p className="font-headline-sm text-headline-sm font-bold text-primary">₹{activeTab === 'machinery' ? item.daily_rate : item.daily_wage}</p>
                   <p className="font-label-sm text-label-sm text-on-surface-variant">{activeTab === 'machinery' ? '/ day' : '/ head'}</p>
                </div>
              </div>
              
              <div className="flex gap-space-sm">
                <button 
                  onClick={() => handleBook(item)}
                  disabled={bookingLoading === item.id || item.available === false}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {bookingLoading === item.id ? (
                     <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  ) : (
                     <>
                        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                        Book Now
                     </>
                  )}
                </button>
              </div>
            </article>
          ))}
          
          {(activeTab === 'machinery' ? machineryList : laborGangs).length === 0 && (
             <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">search_off</span>
                <p className="font-body-md text-body-md">No {activeTab} listings found.</p>
             </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
