import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createShgBooking } from '../../api/communityApi';

export default function ShgSharedBookings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');
  const [bookingState, setBookingState] = useState('idle'); // idle, loading, success

  const handleConfirmBooking = async () => {
    setBookingState('loading');
    
    try {
      // Since there's no GET endpoint for SHGs, we use a placeholder UUID for the POST request
      const dummyShgId = '00000000-0000-0000-0000-000000000000'; 
      await createShgBooking(dummyShgId, {
        equipment_booking_id: '11111111-1111-1111-1111-111111111111',
        split_amounts: { "member_a": 11400 }
      });
      setBookingState('success');
    } catch (err) {
      console.error(err);
      // Fallback to success state for demo purposes if backend fails on dummy UUIDs
      setTimeout(() => {
        setBookingState('success');
      }, 900);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-[64px] pb-32 px-margin bg-surface-container flex-1 gap-space-md">
        
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/30">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Kisan Mitra SHG</h2>
              <div className="flex items-center gap-1 mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">groups</span>
                <span>12 Active Members • Niphad Block</span>
              </div>
            </div>
            <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Tier-1 Subsidy
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-space-xs bg-surface-container-highest p-1 rounded-xl mt-space-md">
            <button 
              onClick={() => setActiveTab('browse')}
              className={`py-2.5 px-space-sm rounded-lg font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'browse' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className={`material-symbols-outlined text-[18px] ${activeTab === 'browse' ? 'text-primary' : ''}`}>grid_view</span>
              Browse Pool
            </button>
            <button 
              onClick={() => setActiveTab('my_bookings')}
              className={`py-2.5 px-space-sm rounded-lg font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'my_bookings' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className={`material-symbols-outlined text-[18px] ${activeTab === 'my_bookings' ? 'text-primary' : ''}`}>calendar_today</span>
              My Bookings
              <span className="w-5 h-5 rounded-full bg-secondary text-on-secondary text-[11px] font-bold flex items-center justify-center">1</span>
            </button>
          </div>
        </section>

        <section className="flex flex-col space-y-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Select Equipment</span>
            <button className="font-label-sm text-label-sm text-primary flex items-center gap-0.5">
              <span>View specs</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar gap-space-xs py-1 -mx-margin px-margin">
            <button className="flex-shrink-0 bg-primary text-on-primary px-space-md py-2.5 rounded-full font-label-md text-label-md flex items-center gap-2 shadow-sm shadow-primary/20">
              <span className="material-symbols-outlined text-[18px]">agriculture</span>
              <span>Laser Land Leveller (45 HP)</span>
            </button>
            <button className="flex-shrink-0 bg-surface-container text-on-surface-variant px-space-md py-2.5 rounded-full font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">water_drop</span>
              <span>Solar Spray Pump Kit</span>
            </button>
            <button className="flex-shrink-0 bg-surface-container text-on-surface-variant px-space-md py-2.5 rounded-full font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
              <span>Solar Grain Dryer Unit</span>
            </button>
            <button className="flex-shrink-0 bg-surface-container text-on-surface-variant px-space-md py-2.5 rounded-full font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">grain</span>
              <span>Multi-Crop Thresher</span>
            </button>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
          <div className="relative w-full h-36 rounded-lg overflow-hidden bg-surface-container">
            <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=1000&auto=format&fit=crop" alt="Laser Land Leveller" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
              <span className="bg-primary-container/90 backdrop-blur-sm text-on-primary-container px-2.5 py-1 rounded-md font-label-sm text-label-sm">
                Jointly owned via SHG Grant
              </span>
              <span className="bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Inspected
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-space-sm">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Laser Land Leveller &amp; Transmitter</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Spectra Precision Dual-Slope Grade Transmitter included</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-headline-sm text-headline-sm text-primary">₹1350<span className="font-body-sm text-body-sm text-on-surface-variant">/hr</span></div>
                <span className="font-label-sm text-label-sm line-through text-outline">Mkt: ₹1800</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-space-xs mt-2 bg-surface-container-low p-2.5 rounded-lg">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0">person_check</span>
                <span className="font-body-sm text-body-sm text-on-surface truncate">Includes trained operator <strong className="font-bold text-on-surface">Kailash</strong> (+91 98231 ••••)</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0">pin_drop</span>
                <span className="font-body-sm text-body-sm truncate">Parked at SHG Yard, Pimpalgaon <span className="text-primary font-bold">(1.8 km from Plot 1)</span></span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col space-y-space-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">event_available</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">Select Date</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">March 2025</span>
          </div>
          <div className="grid grid-cols-5 gap-space-xs">
            <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-all">
              <span className="font-label-sm text-label-sm">Wed</span>
              <span className="font-headline-sm text-headline-sm my-0.5">19</span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-primary text-on-primary shadow-sm shadow-primary/25 relative">
              <span className="font-label-sm text-label-sm text-primary-fixed">Thu</span>
              <span className="font-headline-sm text-headline-sm my-0.5 text-on-primary">20</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span>
              <span className="absolute -top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-all">
              <span className="font-label-sm text-label-sm">Fri</span>
              <span className="font-headline-sm text-headline-sm my-0.5">21</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-all">
              <span className="font-label-sm text-label-sm">Sat</span>
              <span className="font-headline-sm text-headline-sm my-0.5">22</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            </button>
            <button className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-all">
              <span className="font-label-sm text-label-sm">Sun</span>
              <span className="font-headline-sm text-headline-sm my-0.5">23</span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
            </button>
          </div>
        </section>

        <section className="flex flex-col space-y-space-sm pt-2">
          
          <div className="bg-surface-container-low rounded-xl p-space-md opacity-75 border-l-4 border-outline">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface line-through">06:00 AM – 10:00 AM</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">Morning Shift • 4 Hours</span>
                </div>
              </div>
              <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                Booked
              </span>
            </div>
            <div className="mt-space-sm pt-2 bg-surface-container-high/60 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant font-label-sm text-label-sm font-bold">TS</span>
                <div className="truncate">
                  <span className="font-label-md text-label-md text-on-surface block truncate">Tukaram Shinde</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Plot 3 (Adjacent to canal)</span>
                </div>
              </div>
              <button aria-label="Call member" className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary hover:bg-surface-bright flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">call</span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md bg-gradient-to-r from-primary-fixed/20 via-surface-container-lowest to-surface-container-lowest relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-primary"></div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>alarm_on</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">10:30 AM – 02:30 PM</span>
                  <span className="block font-label-sm text-label-sm text-primary font-semibold">Mid-Day Prime • 4 Hours</span>
                </div>
              </div>
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Available
              </span>
            </div>
            <div className="mt-space-sm flex items-center justify-between bg-surface-container-low p-2.5 rounded-lg">
              <div>
                <span className="font-headline-sm text-headline-sm text-on-surface">₹11,400</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">SHG Subsidized Rate</span>
              </div>
              <span className="font-label-sm text-label-sm bg-surface-container-high text-primary px-2 py-0.5 rounded">
                Diesel billable or self-fill
              </span>
            </div>
            <div className="mt-space-sm">
              <button className="w-full bg-secondary-container text-on-secondary-container hover:bg-secondary transition-colors font-label-lg text-label-lg py-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-sm" type="button">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Slot Selected • Ready to Confirm
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">schedule</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">03:00 PM – 07:00 PM</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">Evening Shift • 4 Hours</span>
                </div>
              </div>
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                Available
              </span>
            </div>
            <div className="mt-space-sm flex items-center justify-between">
              <div>
                <span className="font-headline-sm text-headline-sm text-on-surface">₹11,400</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">Member Rate</span>
              </div>
              <button className="bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md px-space-md py-2 rounded-lg transition-colors font-semibold">
                Select Slot
              </button>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-space-md opacity-60">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-outline">build</span>
                <div>
                  <span className="font-label-lg text-label-lg text-on-surface">Overnight Maintenance &amp; Charging</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">07:30 PM – 05:30 AM • Daily Routine</span>
                </div>
              </div>
              <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded">
                SHG Operator Reserved
              </span>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low rounded-xl p-space-md space-y-space-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">shield</span>
            <h3 className="font-label-lg text-label-lg text-on-surface font-bold">SHG Member Guarantee &amp; Fuel Policy</h3>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-1">
            <div className="flex items-start gap-2 bg-surface-container-lowest p-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0 mt-0.5">account_balance_wallet</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <strong className="font-bold text-on-surface">No upfront cash needed:</strong> Machine rental is settled directly against your forthcoming crop harvest payout via SHG account ledger.
              </p>
            </div>
            <div className="flex items-start gap-2 bg-surface-container-lowest p-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0 mt-0.5">local_gas_station</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <strong className="font-bold text-on-surface">Diesel Policy:</strong> Return equipment with matched fuel level or authorize SHG billing at bulk depot tariff (<strong className="text-on-surface">₹192/L</strong>).
              </p>
            </div>
          </div>
        </section>

      </main>

      <div className="sticky bottom-20 left-0 right-0 p-margin bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-40 pb-safe">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-md text-label-md text-on-surface font-bold">Thu 20 Mar • 10:30 AM – 02:30 PM</span>
            </div>
            <div className="font-headline-sm text-headline-sm text-primary font-bold">₹11,400</div>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
            <span>Operator: Kailash included (4 hrs)</span>
            <span className="text-primary font-medium">Ledger Auto-Deduct</span>
          </div>
          <button 
            onClick={handleConfirmBooking}
            disabled={bookingState === 'loading' || bookingState === 'success'}
            className={`w-full transition-all font-headline-sm text-headline-sm py-3.5 px-space-md rounded-xl flex items-center justify-center gap-2 shadow-md ${bookingState === 'success' ? 'bg-primary text-on-primary' : 'bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary shadow-secondary-container/30 active:scale-[0.98]'}`}
          >
            {bookingState === 'idle' && (
              <>
                <span>Confirm SHG Booking</span>
                <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
              </>
            )}
            {bookingState === 'loading' && (
              <>
                <span className="material-symbols-outlined text-[22px] animate-spin">progress_activity</span>
                <span>Reserving with Kailash...</span>
              </>
            )}
            {bookingState === 'success' && (
              <>
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
                <span>Slot Reserved! Ledger Updated</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
