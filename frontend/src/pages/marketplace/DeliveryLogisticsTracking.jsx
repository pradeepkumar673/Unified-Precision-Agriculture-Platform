import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDeliveryStatus, getActiveDelivery, simulateDeliveryUpdate } from '../../api/marketplaceApi';
import AppShell from '../../layouts/AppShell';

export default function DeliveryLogisticsTracking() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const farmId = localStorage.getItem('farmId');
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveData, setLiveData] = useState({
    remaining_km: 18.2,
    speed_kmh: 42,
    status: 'in_transit'
  });
  
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        let res;
        if (orderId && orderId !== '00000000-0000-0000-0000-000000000000') {
          res = await getDeliveryStatus(orderId);
        } else if (farmId) {
          res = await getActiveDelivery(farmId);
        }
        
        if (res && res.data) {
          setDeliveryStatus(res.data);
          setLiveData(prev => ({
            ...prev,
            status: res.data.status
          }));
        }
      } catch (err) {
        console.error('Failed to fetch delivery status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [orderId, farmId]);

  useEffect(() => {
    if (!farmId) return;

    // WebSocket connection for real-time updates
    const wsUrl = API_BASE.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/api/v1/marketplace/ws/${farmId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to real-time delivery tracker');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Real-time delivery event received:", message);
        if (message.type === 'DELIVERY_UPDATE' && message.data) {
          setLiveData({
            remaining_km: message.data.remaining_km,
            speed_kmh: message.data.speed_kmh,
            status: message.data.status
          });
          
          if (deliveryStatus) {
            setDeliveryStatus(prev => ({
              ...prev,
              delivery_eta: message.data.delivery_eta,
              status: message.data.status
            }));
          }
        }
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    return () => {
      if (ws.readyState === 1) {
        ws.close();
      }
    };
  }, [farmId, API_BASE]);

  const handleSimulatePing = async () => {
    if (deliveryStatus?.id) {
      try {
        await simulateDeliveryUpdate(deliveryStatus.id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getFormattedTime = (dateString) => {
    if (!dateString) return '--:--';
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppShell title="Delivery Tracking" showBackButton>
      <main className="flex flex-col w-full px-margin bg-surface flex-1 gap-space-md pt-24 pb-24">
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
          </div>
        ) : !deliveryStatus ? (
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">local_shipping</span>
            <h3 className="font-headline-sm text-headline-sm">No Active Deliveries</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">There are no active orders in transit for this farm.</p>
          </div>
        ) : (
          <>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-1">
              <div className="flex items-start justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Order #{deliveryStatus.id.split('-')[0].toUpperCase()}</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface truncate capitalize">{deliveryStatus.product_name} ({deliveryStatus.qty} bags)</h2>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 text-right">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Est. Arrival</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">{getFormattedTime(deliveryStatus.delivery_eta)}</span>
                </div>
              </div>
              
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-space-xs p-space-sm bg-surface-container-low rounded-lg pb-4 relative overflow-hidden">
                  <div className="absolute left-6 top-10 bottom-0 w-[2px] bg-outline-variant/30"></div>
                  <span className="material-symbols-outlined text-[20px] text-primary flex-shrink-0 relative z-10 bg-surface-container-low" style={{ fontVariationSettings: "'FILL' 1" }}>trip_origin</span>
                  <div className="flex flex-col min-w-0 relative z-10">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Origin Farm</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Farm Gate</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-space-xs p-space-sm bg-surface-container-low rounded-lg relative overflow-hidden">
                  <div className="absolute left-[23px] top-0 h-4 w-[2px] bg-primary"></div>
                  <span className={`material-symbols-outlined text-[20px] text-primary flex-shrink-0 relative z-10 ${liveData.status === 'in_transit' ? 'animate-pulse' : ''}`}>local_shipping</span>
                  <div className="flex items-center justify-between flex-1 min-w-0 relative z-10">
                    <span className="font-label-md text-label-md text-primary font-bold truncate capitalize">{liveData.status.replace('_', ' ')}</span>
                    <span className="font-body-md text-body-md text-on-surface-variant font-medium">{liveData.remaining_km} km</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-space-xs p-space-sm bg-surface-container-low rounded-lg mt-0.5">
                  <span className="material-symbols-outlined text-[20px] text-secondary flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warehouse</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Destination Hub</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate">APMC Grain Warehouse</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative w-full rounded-xl overflow-hidden bg-surface-container shadow-sm group">
              <div className={`relative w-full transition-all duration-300 ease-in-out ${isMapExpanded ? 'h-96' : 'h-52'} bg-surface-container-high overflow-hidden`}>
                <img alt="Live GPS delivery route tracking" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop" />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-black/20 pointer-events-none"></div>
                
                <button onClick={() => setIsMapExpanded(!isMapExpanded)} className="absolute top-3 right-3 h-8 px-2.5 rounded-full bg-surface-container-lowest/90 backdrop-blur text-on-surface font-label-sm text-label-sm flex items-center gap-1 shadow-sm active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[16px]">{isMapExpanded ? 'close_fullscreen' : 'fullscreen'}</span>
                  <span>{isMapExpanded ? 'Collapse' : 'Expand'}</span>
                </button>
                
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  <div className="flex items-center gap-1.5 bg-surface-container-lowest/95 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-primary">speed</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[10px] text-on-surface-variant leading-none">Speed</span>
                      <span className="font-label-md text-label-md text-on-surface leading-tight font-bold">{liveData.speed_kmh} km/h</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container-lowest/95 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-secondary">alt_route</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[10px] text-on-surface-variant leading-none">Remaining</span>
                      <span className="font-label-md text-label-md text-on-surface leading-tight font-bold">{liveData.remaining_km} km</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container-lowest/95 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-primary">traffic</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[10px] text-on-surface-variant leading-none">Traffic</span>
                      <span className="font-label-md text-label-md text-primary leading-tight font-bold">Light</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <div className="flex items-center justify-between mb-space-md">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Transit Timeline</h3>
                <span className={`font-label-sm text-label-sm font-bold px-2 py-0.5 rounded ${deliveryStatus.delayed ? 'bg-error-container text-on-error-container' : 'bg-primary/10 text-primary'}`}>
                  {deliveryStatus.delayed ? 'Delayed' : 'Real-time GPS'}
                </span>
              </div>
              
              <div className="relative pl-7 flex flex-col gap-5">
                <div className="absolute left-3 top-2 bottom-3 w-0.5 bg-surface-container-high"></div>
                
                <div className="relative flex flex-col">
                  <div className="absolute -left-7 top-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined text-[15px]">check</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Order Confirmed</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Trader accepted rate &amp; dispatched truck</p>
                </div>
                
                <div className="relative flex flex-col">
                  <div className="absolute -left-7 top-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined text-[15px]">check</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Picked up from Farm</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Gate bags loaded &amp; RFID tagged</p>
                </div>
                
                <div className="relative flex flex-col">
                  <div className={`absolute -left-7 top-0 w-6 h-6 rounded-full flex items-center justify-center text-on-secondary ring-4 ring-secondary/20 ${liveData.status === 'in_transit' ? 'bg-secondary animate-pulse' : 'bg-primary'}`}>
                    <span className="material-symbols-outlined text-[15px]">{liveData.status === 'in_transit' ? 'local_shipping' : 'check'}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-label-md text-label-md text-secondary font-bold">In Transit</span>
                    <span className="font-label-sm text-label-sm font-bold text-secondary">Active Now</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface">Cruising at {liveData.speed_kmh} km/h • {liveData.remaining_km} km remaining to APMC</p>
                </div>
                
                <div className="relative flex flex-col opacity-65">
                  <div className="absolute -left-7 top-0 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[15px]">inventory_2</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-label-md text-label-md text-on-surface">Delivered &amp; Weighed</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Est. {getFormattedTime(deliveryStatus.delivery_eta)}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">APMC Weighbridge digital slip issuance</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-13 h-13 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 text-primary">
                  <span className="material-symbols-outlined text-[32px]">account_circle</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-label-lg text-label-lg text-on-surface truncate">Rajendra Singh</span>
                    <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }} title="Verified Transporter">verified</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="font-label-sm text-label-sm text-amber-700 font-bold flex items-center">★ 4.9</span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-label-sm text-label-sm">320+ farm trips</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">Tata 407 Agri-Carrier • MH-15-EG-4421</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-space-sm pt-1">
                <a className="h-12 rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm" href="tel:+919876543210">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                  <span>Call Driver</span>
                </a>
                <button className="h-12 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-surface-container-high active:scale-95 transition-transform" type="button">
                  <span className="material-symbols-outlined text-[20px] text-primary">chat</span>
                  <span>Message</span>
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Consignment &amp; Papers</h3>
              <div className="flex flex-col gap-2 divide-y divide-surface-container-low">
                <div className="flex items-start justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">sell</span>
                    <div>
                      <div className="font-label-md text-label-md text-on-surface">{deliveryStatus.qty} bags</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">RFID Security Seal #892</div>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded">Tamper Safe</span>
                </div>
                
                <div className="flex items-start justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-secondary">verified_user</span>
                    <div>
                      <div className="font-label-md text-label-md text-on-surface">E-Waybill #EB-{new Date().getFullYear()}-0981</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Govt. Verified Kisan Pass</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </div>
              
              <button className="w-full mt-1 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between active:scale-[0.99] transition-transform" type="button">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[22px] text-primary">description</span>
                  <span className="font-label-md text-label-md text-on-surface text-left">View Digital Weighment Slip &amp; Pass</span>
                </div>
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">download</span>
              </button>
            </div>
            
            <div className="w-full text-center mt-2">
              <button onClick={handleSimulatePing} className="px-4 py-2 bg-surface-container text-on-surface rounded-full font-label-sm text-[12px] opacity-70 hover:opacity-100">
                Test: Simulate Incoming GPS Ping
              </button>
            </div>

            <div className="p-space-sm text-center flex flex-col items-center gap-1 text-on-surface-variant mb-2">
              <p className="font-body-sm text-body-sm">Need route assistance or schedule changes?</p>
              <button className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 hover:underline" type="button">
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                <span>Contact Mandi Logistics Desk (Toll-Free)</span>
              </button>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}
