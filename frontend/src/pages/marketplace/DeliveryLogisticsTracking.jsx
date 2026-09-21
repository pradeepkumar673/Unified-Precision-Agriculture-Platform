import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDeliveryStatus } from '../../api/marketplaceApi';

export default function DeliveryLogisticsTracking() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const idToFetch = orderId || '00000000-0000-0000-0000-000000000000'; // fallback for demo
        const res = await getDeliveryStatus(idToFetch);
        setDeliveryStatus(res.data);
      } catch (err) {
        console.error('Failed to fetch delivery status, using static fallback for visual demonstration.', err);
        setDeliveryStatus({
          status: 'in_transit',
          delivery_eta: '2025-03-18T10:45:00Z',
          delayed: false
        });
      }
    };
    fetchStatus();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-20 pb-24 px-margin bg-surface flex-1 gap-space-md">
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-1">
          <div className="flex items-start justify-between">
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Order #ORD-8821</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">Wheat • Sharbati Gold (95 Qtl)</h2>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 text-right">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Est. Arrival</span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">10:45 AM</span>
            </div>
          </div>
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-space-xs p-space-sm bg-surface-container-low rounded-lg pb-4 relative overflow-hidden">
              <div className="absolute left-6 top-10 bottom-0 w-[2px] bg-outline-variant/30"></div>
              <span className="material-symbols-outlined text-[20px] text-primary flex-shrink-0 relative z-10 bg-surface-container-low" style={{ fontVariationSettings: "'FILL' 1" }}>trip_origin</span>
              <div className="flex flex-col min-w-0 relative z-10">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Origin Farm</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Plot 1 (North Parcel)</span>
              </div>
            </div>
            
            <div className="flex items-center gap-space-xs p-space-sm bg-surface-container-low rounded-lg relative overflow-hidden">
              <div className="absolute left-[23px] top-0 h-4 w-[2px] bg-primary"></div>
              <span className="material-symbols-outlined text-[20px] text-primary animate-pulse flex-shrink-0 relative z-10">local_shipping</span>
              <div className="flex items-center justify-between flex-1 min-w-0 relative z-10">
                <span className="font-label-md text-label-md text-primary font-bold truncate">In Transit</span>
                <span className="font-body-md text-body-md text-on-surface-variant font-medium">18.2 km</span>
              </div>
            </div>
            
            <div className="flex items-center gap-space-xs p-space-sm bg-surface-container-low rounded-lg mt-0.5">
              <span className="material-symbols-outlined text-[20px] text-secondary flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warehouse</span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Destination Hub</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Hadapsar APMC Grain Warehouse 4</span>
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
                  <span className="font-label-md text-label-md text-on-surface leading-tight font-bold">42 km/h</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container-lowest/95 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[16px] text-secondary">alt_route</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-on-surface-variant leading-none">Remaining</span>
                  <span className="font-label-md text-label-md text-on-surface leading-tight font-bold">18.2 km</span>
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
            <span className={`font-label-sm text-label-sm font-bold px-2 py-0.5 rounded ${deliveryStatus?.delayed ? 'bg-error-container text-on-error-container' : 'bg-primary/10 text-primary'}`}>
              {deliveryStatus?.delayed ? 'Delayed' : 'Real-time GPS'}
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
                <span className="font-label-sm text-label-sm text-on-surface-variant">08:30 AM</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Trader accepted rate &amp; dispatched truck</p>
            </div>
            
            <div className="relative flex flex-col">
              <div className="absolute -left-7 top-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[15px]">check</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Picked up from Farm</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">09:15 AM</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Plot 1 Gate • Bags loaded &amp; RFID tagged</p>
            </div>
            
            <div className="relative flex flex-col">
              <div className="absolute -left-7 top-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary ring-4 ring-secondary/20 animate-pulse">
                <span className="material-symbols-outlined text-[15px]">local_shipping</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-label-md text-label-md text-secondary font-bold">In Transit • Belapur Bypass</span>
                <span className="font-label-sm text-label-sm font-bold text-secondary">Active Now</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface">Cruising at 42 km/h • 18.2 km remaining to APMC</p>
            </div>
            
            <div className="relative flex flex-col opacity-65">
              <div className="absolute -left-7 top-0 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px]">inventory_2</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-label-md text-label-md text-on-surface">Delivered &amp; Weighed</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Est. 10:45 AM</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">APMC Weighbridge #2 digital slip issuance</p>
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
                  <div className="font-label-md text-label-md text-on-surface">95 Quintals (190 bags)</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">RFID Security Seal #892</div>
                </div>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded">Tamper Safe</span>
            </div>
            
            <div className="flex items-start justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">verified_user</span>
                <div>
                  <div className="font-label-md text-label-md text-on-surface">E-Waybill #EB-2025-0981</div>
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

        <div className="p-space-sm text-center flex flex-col items-center gap-1 text-on-surface-variant mb-2">
          <p className="font-body-sm text-body-sm">Need route assistance or schedule changes?</p>
          <button className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 hover:underline" type="button">
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>Contact Mandi Logistics Desk (Toll-Free)</span>
          </button>
        </div>
      </main>

      
    </div>
  );
}
