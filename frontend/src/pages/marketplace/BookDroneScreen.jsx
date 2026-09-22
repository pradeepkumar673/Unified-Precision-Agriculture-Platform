import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function BookDroneScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, booking, success

  const handleBook = () => {
    setStatus('booking');
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative pb-safe">
      <main className="flex-1 p-margin pt-space-lg flex flex-col gap-space-md">
        
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface mb-2">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Book a Spray Drone</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Your Variable Rate (VRA) Prescription Map will be automatically loaded into the drone's flight controller.</p>
        
        <div className="bg-surface-container-low rounded-2xl p-space-md border border-outline-variant mt-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">flight_takeoff</span>
            </div>
            <div>
              <h3 className="font-title-md text-title-md font-bold">Local CHC Operator</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">DJI Agras T40 • 40L Capacity</p>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-outline-variant">
            <span className="font-body-md text-body-md text-on-surface-variant">Estimated Area</span>
            <span className="font-title-md text-title-md font-bold">4.2 Acres</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-outline-variant">
            <span className="font-body-md text-body-md text-on-surface-variant">Prescription Mode</span>
            <span className="font-title-md text-title-md font-bold text-primary">ISO-XML Variable Rate</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-body-md text-body-md text-on-surface-variant">Service Fee (Subsidized)</span>
            <span className="font-title-md text-title-md font-bold text-secondary">₹1,200</span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-space-md border border-outline-variant flex flex-col gap-3">
          <h3 className="font-title-md text-title-md font-bold">Select Date & Time</h3>
          <input type="date" className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant font-body-md text-on-surface focus:outline-primary" defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
          <div className="flex gap-2">
             <button className="flex-1 py-2 bg-primary-container text-on-primary-container font-label-md rounded-xl font-bold border border-primary">Morning</button>
             <button className="flex-1 py-2 bg-surface-container text-on-surface font-label-md rounded-xl border border-outline-variant">Evening</button>
          </div>
        </div>

      </main>

      <footer className="p-margin sticky bottom-0 bg-surface shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        {status === 'success' ? (
           <button onClick={() => navigate('/marketplace/rentals')} className="w-full h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold flex items-center justify-center gap-2">
             <span className="material-symbols-outlined">check_circle</span>
             Booking Confirmed
           </button>
        ) : (
          <button onClick={handleBook} disabled={status === 'booking'} className="w-full h-14 bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary rounded-xl font-title-md font-bold flex items-center justify-center gap-2 transition-colors">
            {status === 'booking' ? (
               <span className="animate-spin material-symbols-outlined">progress_activity</span>
            ) : (
               <>
                 <span className="material-symbols-outlined">payments</span>
                 Book Operator • ₹1,200
               </>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}
