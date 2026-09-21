import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipmentListings, bookEquipment } from '../../api/marketplaceApi';

export default function ProductDetailMachineryRental() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [activeTab, setActiveTab] = useState('rent');
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  useEffect(() => {
    const fetchEq = async () => {
      try {
        const res = await getEquipmentListings();
        if (res.data && res.data.length > 0) {
          setEquipment(res.data[0]); // Default to first available equipment
        } else {
          setEquipment({
            id: 'demo-123',
            equipment_type: 'Claas Crop Harvester & Operator',
            owner_id: 'Nashik Krishi Co-op',
            daily_rate: 11400,
            latitude: 20.0,
            longitude: 73.7,
            available: true
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEq();
  }, []);

  const handleBook = async () => {
    try {
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + 2);
      
      await bookEquipment({
        listing_id: equipment.id,
        farm_id: localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000',
        start_date: today.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0]
      });
      alert('Booking Confirmed!');
    } catch (err) {
      alert('Failed to book: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pb-32 flex-1">
        <div className="w-full aspect-[4/3] relative bg-surface-variant overflow-hidden">
          <img alt="Harvester" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1592982537447-6f2a6a0c5983?q=80&w=800&auto=format&fit=crop" />
          <div className="absolute bottom-3 left-3 bg-tertiary-container text-on-tertiary-container px-2.5 py-1 rounded-full font-label-sm text-label-sm shadow-sm flex items-center gap-1 font-bold">
            <span className="material-symbols-outlined text-[14px]">agriculture</span>
            <span>Heavy Machinery</span>
          </div>
          <div className="absolute bottom-3 right-3 bg-surface-container-lowest/80 backdrop-blur-md text-on-surface px-2 py-0.5 rounded text-[11px] font-bold shadow-sm">
            1/5
          </div>
        </div>

        <div className="px-margin pt-space-md flex flex-col gap-space-md bg-surface -mt-4 relative z-10 rounded-t-3xl">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-secondary font-bold tracking-wide uppercase">For Rent</span>
              <div className="flex items-center gap-1 bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">history</span>
                <span className="font-label-sm text-[11px] leading-tight font-semibold">2022 Model</span>
              </div>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
              {equipment ? equipment.equipment_type : 'Claas Crop Harvester & Operator'}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 font-label-sm text-label-sm text-on-surface-variant">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">speed</span>
                <span>1.8 Acres/hr capacity</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">grain</span>
                <span>Minimal grain loss &lt;1%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">local_gas_station</span>
                <span>Diesel included</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col space-y-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-sm font-bold flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">agriculture</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-label-lg text-label-lg text-on-surface font-bold truncate">{equipment ? equipment.owner_id : 'Nashik Krishi Co-op'}</h3>
                    <span className="material-symbols-outlined text-[16px] text-primary" title="Verified Cooperative">verified</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
                    <span className="text-secondary font-bold flex items-center">4.8 <span className="material-symbols-outlined text-[14px] ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>star</span></span>
                    <span>•</span>
                    <span className="truncate">142 completed rentals</span>
                  </div>
                </div>
              </div>
              <a aria-label="Call Owner or Dispatcher" className="h-11 px-space-sm rounded-full bg-surface-container flex items-center justify-center gap-1.5 text-primary hover:bg-surface-container-high transition-colors active:scale-95 flex-shrink-0" href="tel:+919876543210">
                <span className="material-symbols-outlined text-[20px]">call</span>
                <span className="font-label-md text-label-md font-bold">Call Dispatch</span>
              </a>
            </div>
            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between text-on-surface-variant">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0">pin_drop</span>
                <span className="font-body-sm text-body-sm truncate">4.2 km from Plot 1 (Niphad Road Depot)</span>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-bold flex-shrink-0 ml-2">~18 mins dispatch</span>
            </div>
          </div>

          <div className="bg-surface-container p-1 rounded-xl flex items-center gap-1">
            <button onClick={() => setActiveTab('rent')} className={`flex-1 h-12 rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'rent' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant font-semibold hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-[20px]">schedule</span>
              <span>Rent Machine</span>
            </button>
            <button onClick={() => setActiveTab('parts')} className={`flex-1 h-12 rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'parts' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant font-semibold hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-[20px]">build_circle</span>
              <span>Spare Parts &amp; Kits</span>
            </button>
          </div>

          {activeTab === 'rent' && (
            <div className="space-y-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Harvest Window</h3>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary font-bold bg-primary-fixed/40 px-2 py-0.5 rounded">Optimal Weather</span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-1">
                  <button className="flex flex-col text-left p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all active:scale-[0.98]" type="button">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Start Date</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface mt-1">18 Mar 2025</span>
                    <span className="font-label-sm text-label-sm text-primary font-semibold mt-0.5">Tuesday • Morning 8 AM</span>
                  </button>
                  <button className="flex flex-col text-left p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all active:scale-[0.98]" type="button">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">End Date</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface mt-1">20 Mar 2025</span>
                    <span className="font-label-sm text-label-sm text-primary font-semibold mt-0.5">Thursday • Evening 6 PM</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-surface-container-high/60 rounded-lg px-3 py-2 text-on-surface">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">timelapse</span>
                    <span className="font-label-md text-label-md font-semibold">Total Duration:</span>
                  </div>
                  <span className="font-label-md text-label-md font-bold text-secondary">2 Days (Approx. 16 Operating Hours)</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">terrain</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Delivery Farm Parcel</h3>
                  </div>
                  <button className="font-label-md text-label-md font-bold text-secondary hover:underline" type="button">Change</button>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3 flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-[22px] text-primary mt-0.5">check_circle</span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface truncate">Plot 1 (North Parcel)</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">KhetSaathi GPS Linked</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Sharbati Wheat • 4.5 Acres • Ready for Cutting</p>
                    <span className="font-label-sm text-label-sm text-primary font-semibold mt-1">Direct tractor path accessible from Niphad bypass</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Included Operational Services</h3>
                <label className="flex items-start gap-space-sm p-3 rounded-lg bg-surface-container-low cursor-pointer select-none">
                  <input defaultChecked className="w-5 h-5 rounded mt-0.5 text-primary focus:ring-0 accent-primary" type="checkbox" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md font-bold text-on-surface">Local Certified Operator</span>
                      <span className="font-label-sm text-label-sm text-primary font-bold">Free of Charge</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Vetted master driver trained on combine calibration for minimal seed loss.</p>
                  </div>
                </label>
                <div className="bg-primary-fixed/30 rounded-lg p-3 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-primary mt-0.5">shield</span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-label-md text-label-md font-bold text-on-primary-fixed">₹0 Security Deposit Required</span>
                    <p className="font-body-sm text-body-sm text-on-primary-fixed-variant mt-0.5">
                      Auto-waived for verified KhetSaathi farmers with an active digital crop plan for Rabi 2025.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parts' && (
            <div className="space-y-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Compatible Harvester Attachments</h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Genuine OEM</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[24px]">hardware</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-bold text-on-surface">Hardened Cutter Bar Knife</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">High wear resistance • 24 tooth</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-label-lg text-label-lg font-bold text-secondary">₹11,850</span>
                    <button className="font-label-sm text-label-sm font-bold text-primary hover:underline">+ Add Part</button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[24px]">construction</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-bold text-on-surface">Thresher Concave Rasp Set</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Wheat &amp; Mustard tuned</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-label-lg text-label-lg font-bold text-secondary">₹13,400</span>
                    <button className="font-label-sm text-label-sm font-bold text-primary hover:underline">+ Add Part</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-2.5 mb-24">
            <div className="flex items-center justify-between">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">Billing Estimate</span>
              <span className="font-label-sm text-label-sm text-primary font-bold">Govt. Custom Hiring Rates Applied</span>
            </div>
            <div className="space-y-1.5 font-body-sm text-body-sm text-on-surface-variant">
              <div className="flex justify-between">
                <span>Machine Hiring (2 Full Days / 16 hrs)</span>
                <span className="font-semibold text-on-surface">₹23,000</span>
              </div>
              <div className="flex justify-between">
                <span>Operator Allowance (Certified driver)</span>
                <span className="text-primary font-semibold">Included (₹0)</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel &amp; Fluids (Base quota)</span>
                <span className="text-primary font-semibold">Included</span>
              </div>
              <div className="flex justify-between">
                <span>Road Transit to Plot 1</span>
                <span className="text-primary font-semibold">Free (&lt;10 km)</span>
              </div>
            </div>
            <div className="pt-2 border-t border-surface-container-high flex items-baseline justify-between mt-2">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Estimated Payable Amount</span>
                <span className="font-headline-md text-headline-md font-bold text-on-surface">₹23,000</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-bold bg-secondary-fixed/40 px-2 py-1 rounded">Pay after harvest completion</span>
            </div>
          </div>
        </div>
      </main>

      <div className="sticky bottom-20 left-0 right-0 bg-surface-container-lowest p-space-md shadow-[0_-4px_12px_rgba(0,0,0,0.05)] space-y-space-sm z-30 pb-safe">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Total Rental Quote (2 Days)</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₹23,000</span>
          </div>
          <div className="flex items-center gap-1 text-primary font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>Secure Escrow</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
          <button className="w-full h-14 rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors active:scale-[0.98]" type="button">
            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
            <span>Add to Rental Cart</span>
          </button>
          <button onClick={handleBook} className="w-full h-14 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 shadow-md transition-all active:scale-[0.98]" type="button">
            <span>Book &amp; Reserve Dates</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
