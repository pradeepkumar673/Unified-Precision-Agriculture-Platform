import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initiatePayment } from '../../api/financeApi';

export default function PaymentCheckout() {
  const navigate = useNavigate();
  const [paymentOption, setPaymentOption] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState(null); // null, 'securing', 'redirecting', 'success'

  const handlePaymentOptionSelect = (option) => {
    setPaymentOption(option);
  };

  const handleTriggerPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setProcessStatus('securing');

    try {
      // Simulate calling the backend initiate endpoint
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      const res = await initiatePayment({
        related_entity_id: farmId,
        amount: 126885,
        type: 'marketplace'
      });

      setProcessStatus('redirecting');
      
      // Since this is Razorpay test mode, we typically use the window.Razorpay script
      // Here we just simulate success after a delay to mimic the redirect
      setTimeout(() => {
        setProcessStatus('success');
        setTimeout(() => {
          setIsProcessing(false);
          setProcessStatus(null);
          // navigate to success or ledger
          navigate('/finance/wallet');
        }, 1500);
      }, 1500);

    } catch (err) {
      console.error('Payment failed', err);
      setIsProcessing(false);
      setProcessStatus(null);
      alert('Payment initialization failed. Please try again.');
    }
  };

  const getButtonText = () => {
    if (processStatus === 'securing') return (
      <>
        <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
        <span>Securing Escrow...</span>
      </>
    );
    if (processStatus === 'redirecting' || processStatus === 'success') return (
      <>
        <span className="material-symbols-outlined text-[20px]">check_circle</span>
        <span>Redirecting to Bank...</span>
      </>
    );
    return (
      <>
        <span>Pay ₹126,885 Securely</span>
        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-[64px] pb-32 px-margin bg-surface flex-1">
        
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-md flex flex-col gap-space-sm border border-surface-container">
          <div className="flex justify-between items-start">
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Order Summary</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">Claas Harvester + Wheat Seeds</h2>
            </div>
            <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-space-xs py-0.5 rounded flex-shrink-0 font-bold">Verified FPO</span>
          </div>
          
          <div className="flex items-center gap-space-xs overflow-x-auto py-space-xs no-scrollbar">
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[18px]">agriculture</span>
              <span className="font-label-sm text-label-sm text-on-surface">Harvester (2 Days)</span>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined text-secondary text-[18px]">grain</span>
              <span className="font-label-sm text-label-sm text-on-surface">HD-2967 (50 kg)</span>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined text-tertiary text-[18px]">local_shipping</span>
              <span className="font-label-sm text-label-sm text-on-surface">Plot 1 Transit</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-space-xs pt-space-xs">
            <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm">
              <span>Claas Combine Harvester (16 hrs / 2 Days)</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold">₹123,000</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm">
              <span>Certified Wheat Seeds (25 kg A- 2 bags)</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold">₹13,700</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm">
              <div className="flex items-center gap-1">
                <span>Transit to Plot 1</span>
                <span className="bg-surface-container-high text-on-surface-variant text-[11px] font-bold px-1.5 py-0.5 rounded">FPO Subsidized</span>
              </div>
              <span className="font-label-md text-label-md text-primary font-bold">FREE</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm">
              <span>GST &amp; Agricultural Infrastructure Cess (5%)</span>
              <span className="font-label-md text-label-md text-on-surface">₹11,185</span>
            </div>
            <div className="flex justify-between items-center text-primary font-body-sm text-body-sm">
              <span className="flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[16px]">redeem</span>
                Kisan FPO Member Benefit
              </span>
              <span className="font-label-md text-label-md font-bold">-₹11,000</span>
            </div>
          </div>
          
          <div className="bg-surface-container-low p-space-sm rounded-xl mt-space-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Net Payable Total</span>
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold tracking-tight">₹126,885</span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-lowest px-space-sm py-1.5 rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <span className="font-label-sm text-label-sm text-on-surface font-bold">Escrow Safe</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-space-md mb-space-lg flex gap-space-sm items-start">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 text-primary">
            <span className="material-symbols-outlined text-[24px]">shield_person</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="font-label-lg text-label-lg text-on-surface font-bold">KhetSaathi Kisan Trust Protocol</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Payment remains safely locked in our RBI-regulated escrow account. Vendor is paid only after physical harverster delivery &amp; seed germination check.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-space-sm px-space-xs">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Select Payment Option</h3>
          <span className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">bolt</span> Instant Confirmation
          </span>
        </div>

        <div className="flex flex-col gap-space-sm mb-space-lg">
          
          {/* Option 1: UPI */}
          <div 
            className={`cursor-pointer rounded-xl p-space-md shadow-sm transition-all relative overflow-hidden ${paymentOption === 'upi' ? 'bg-primary/5' : 'bg-surface-container-lowest'}`}
            onClick={() => handlePaymentOptionSelect('upi')}
          >
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-start gap-space-sm min-w-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${paymentOption === 'upi' ? 'bg-primary text-on-primary' : 'bg-surface-container text-transparent'}`}>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">UPI (Instant 0% Fee)</span>
                    <span className="bg-primary-fixed text-on-primary-fixed text-[11px] font-bold px-1.5 py-0.2 rounded">Recommended</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Pay via Google Pay, PhonePe, Paytm or BHIM</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-[24px]">qr_code_scanner</span>
            </div>
            
            <div className="flex items-center gap-space-xs mt-space-sm pl-8">
              <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-on-surface font-semibold">GPay</span>
              <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-on-surface font-semibold">PhonePe</span>
              <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-on-surface font-semibold">Paytm</span>
              <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-on-surface font-semibold">BHIM</span>
            </div>
            
            {paymentOption === 'upi' && (
              <div className="mt-space-md pt-space-sm pl-8 flex flex-col gap-space-sm animate-fade-in">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">Enter your VPA / UPI ID</label>
                <div className="flex items-center gap-space-xs bg-surface-container-low rounded-xl px-space-sm py-1">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">account_balance_wallet</span>
                  <input className="bg-transparent flex-1 font-label-md text-label-md text-on-surface outline-none py-2" placeholder="username@upi" type="text" defaultValue="farmer.kisan@oksbi" />
                  <button className="bg-primary-container text-on-primary-container px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm font-bold active:scale-95 transition-transform" type="button">Verified</button>
                </div>
                <div className="flex items-center gap-space-xs text-primary font-label-sm text-label-sm pt-1">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  <span className="font-medium">Or scan QR code at Village CSC Center</span>
                </div>
              </div>
            )}
          </div>

          {/* Option 2: Kisan Credit Card (KCC) */}
          <div 
            className={`cursor-pointer rounded-xl p-space-md shadow-sm transition-all ${paymentOption === 'kcc' ? 'bg-primary/5' : 'bg-surface-container-lowest'}`}
            onClick={() => handlePaymentOptionSelect('kcc')}
          >
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-start gap-space-sm min-w-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${paymentOption === 'kcc' ? 'bg-primary text-on-primary' : 'bg-surface-container text-transparent'}`}>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-space-xs flex-wrap">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">Kisan Credit Card (KCC) / Cards</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Subsidized 4% interest rate eligible</span>
                  <div className="mt-space-xs flex items-center gap-space-xs">
                    <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded font-bold">Pre-approved: ₹11,50,000</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[24px]">credit_card</span>
            </div>
          </div>

          {/* Option 3: KhetSaathi Wallet */}
          <div 
            className={`cursor-pointer rounded-xl p-space-md shadow-sm transition-all ${paymentOption === 'wallet' ? 'bg-primary/5' : 'bg-surface-container-lowest'}`}
            onClick={() => handlePaymentOptionSelect('wallet')}
          >
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-start gap-space-sm min-w-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${paymentOption === 'wallet' ? 'bg-primary text-on-primary' : 'bg-surface-container text-transparent'}`}>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">KhetSaathi Agri Wallet</span>
                    <span className="bg-surface-container-high text-on-surface text-[11px] font-bold px-1.5 py-0.5 rounded">1-Tap</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Available Balance: ₹11,84,320 (Harvest proceeds)</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[24px]">payments</span>
            </div>
          </div>

          {/* Option 4: Cash on Delivery / Field Delivery */}
          <div 
            className={`cursor-pointer rounded-xl p-space-md shadow-sm transition-all ${paymentOption === 'cod' ? 'bg-primary/5' : 'bg-surface-container-lowest'}`}
            onClick={() => handlePaymentOptionSelect('cod')}
          >
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-start gap-space-sm min-w-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${paymentOption === 'cod' ? 'bg-primary text-on-primary' : 'bg-surface-container text-transparent'}`}>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">Pay on Field Delivery (COD)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Pay driver directly via Cash or UPI at Plot 1 gate</span>
                  <span className="font-label-sm text-label-sm text-secondary mt-1 font-semibold">₹1500 advance slot deposit required</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[24px]">local_shipping</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-space-md mb-space-md flex flex-col gap-space-sm">
          <div className="flex items-center justify-around gap-space-sm text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[22px]">lock_clock</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">256-Bit SSL</span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest"></div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[22px]">account_balance</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">RBI Regulated</span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest"></div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[22px]">verified</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">NPCI Certified</span>
            </div>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant text-center opacity-80 mt-1">
            Bank-grade compliance standard for agricultural produce &amp; rural credit.
          </p>
        </div>

        <div className="flex items-center justify-center gap-space-xs mt-space-xs text-on-surface-variant pb-6">
          <span className="material-symbols-outlined text-primary text-[18px]">support_agent</span>
          <span className="font-label-sm text-label-sm">Need help? Call Toll-free Kisan Sahayata 1800-180-1551</span>
        </div>
      </main>

      <div className="sticky bottom-20 left-0 right-0 p-space-md bg-surface-container-lowest/95 backdrop-blur-md z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-space-md">
          <div className="flex flex-col min-w-0">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Amount to Pay</span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-md text-headline-md text-primary font-bold">₹126,885</span>
            </div>
          </div>
          <button 
            disabled={isProcessing}
            onClick={handleTriggerPayment}
            className="flex-1 h-14 bg-secondary-container text-on-primary rounded-xl flex items-center justify-center gap-space-xs font-label-lg text-label-lg font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100" 
            type="button"
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
