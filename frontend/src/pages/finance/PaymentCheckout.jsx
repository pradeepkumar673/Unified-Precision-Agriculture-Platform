import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { initiatePayment, getLedger, getCreditProfile } from '../../api/financeApi';
import { getFarmProfile } from '../../api/farmApi';
import { getProducts, getEquipmentListings } from '../../api/marketplaceApi';
import AppShell from '../../layouts/AppShell';

export default function PaymentCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [paymentOption, setPaymentOption] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState(null); // null, 'securing', 'redirecting', 'success'

  const [loading, setLoading] = useState(true);
  const [farmData, setFarmData] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [kccLimit, setKccLimit] = useState(0);
  const [cartData, setCartData] = useState({
    title: 'Loading...',
    equipmentName: 'Equipment',
    equipmentPrice: 0,
    productName: 'Seeds',
    productPrice: 0,
    transitCost: 0,
    gstAmount: 0,
    fpoDiscount: 0,
    total: 0
  });

  const handlePaymentOptionSelect = (option) => {
    setPaymentOption(option);
  };

  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
        
        // 1. Fetch Farm Data
        let fData = null;
        try {
          const farmRes = await getFarmProfile(farmId);
          fData = farmRes.data;
          setFarmData(fData);
        } catch (e) {
          console.log('Farm profile fallback');
        }

        // 2. Fetch Ledger for Wallet Balance
        try {
          const ledgerRes = await getLedger(farmId);
          const txs = ledgerRes.data || [];
          let bal = 0;
          txs.forEach(tx => {
            if (tx.type === 'marketplace' || tx.type === 'loan_disbursement') {
              // rough mock of balance calculation
              bal += tx.amount; 
            }
          });
          // Add some base amount if new user
          setWalletBalance(bal > 0 ? bal : 1184320); 
        } catch (e) {
          setWalletBalance(1184320); // Fallback
        }

        // 3. Fetch Credit Profile for KCC Limit
        try {
          const creditRes = await getCreditProfile(farmId);
          if (creditRes.data && creditRes.data.offers && creditRes.data.offers.length > 0) {
            setKccLimit(creditRes.data.offers[0].max_amount);
          } else {
            setKccLimit(1150000);
          }
        } catch (e) {
          setKccLimit(1150000);
        }

        // 4. Build Cart (Dynamic from DB)
        // Check if passed via location
        if (location.state && location.state.cart) {
          setCartData(location.state.cart);
        } else {
          // Fetch real products as fallback
          let eqName = 'Combine Harvester (2 Days)';
          let eqPrice = 123000;
          let prName = 'High-Yield Wheat Seeds (2 bags)';
          let prPrice = 13700;

          try {
            const eqRes = await getEquipmentListings();
            if (eqRes.data && eqRes.data.length > 0) {
              const eq = eqRes.data[0];
              eqName = `${eq.name} (16 hrs)`;
              eqPrice = Math.round(eq.rate_per_hour * 16);
            }
          } catch(e) {}

          try {
            const prRes = await getProducts(farmId);
            if (prRes.data && prRes.data.length > 0) {
              const pr = prRes.data[0];
              prName = `${pr.name} (2 bags)`;
              prPrice = Math.round(pr.price * 2);
            }
          } catch(e) {}

          const subtotal = eqPrice + prPrice;
          const gst = Math.round(subtotal * 0.05);
          const fpoDiscount = 11000;
          const total = subtotal + gst - fpoDiscount;

          setCartData({
            title: `${eqName.split('(')[0].trim()} + ${prName.split('(')[0].trim()}`,
            equipmentName: eqName,
            equipmentPrice: eqPrice,
            productName: prName,
            productPrice: prPrice,
            transitCost: 0,
            gstAmount: gst,
            fpoDiscount: fpoDiscount,
            total: total > 0 ? total : 0
          });
        }
      } catch (err) {
        console.error('Failed to load real data', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDynamicData();
  }, [location]);

  const handleTriggerPayment = async () => {
    if (isProcessing) return;
    
    if (paymentOption === 'upi') {
      if (!upiId.trim()) {
        setUpiError('UPI ID is required');
        return;
      }
      if (!upiId.includes('@')) {
        setUpiError('Please enter a valid UPI ID (e.g. name@bank)');
        return;
      }
    }
    
    setUpiError('');
    setIsProcessing(true);
    setProcessStatus('securing');

    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      const res = await initiatePayment({
        related_entity_id: farmId,
        amount: cartData.total,
        type: 'marketplace'
      });

      setProcessStatus('redirecting');

      // Load Razorpay Script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: "rzp_test_RMHdBS5ea7cEEb", // User's Razorpay Test Key
          amount: Math.round(cartData.total * 100),
          currency: "INR",
          name: "KhetSaathi Agri Platform",
          description: cartData.title,
          order_id: res.data.razorpay_order_id,
          handler: function (response) {
            console.log("Payment Successful", response);
            setProcessStatus('success');
            setTimeout(() => {
              setIsProcessing(false);
              setProcessStatus(null);
              navigate('/finance/wallet');
            }, 1000);
          },
          prefill: {
            name: farmData?.name || "KhetSaathi Farmer",
            email: "farmer@khetsaathi.in",
            contact: "9999999999"
          },
          theme: {
            color: "#1F4228"
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
          console.error(response.error);
          setIsProcessing(false);
          setProcessStatus(null);
          alert('Payment Failed: ' + response.error.description);
        });
        rzp.open();
      };
      script.onerror = () => {
        setIsProcessing(false);
        setProcessStatus(null);
        alert('Failed to load Razorpay SDK');
      };
      document.body.appendChild(script);

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
        <span>Pay ₹{cartData.total.toLocaleString()} Securely</span>
        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
      </>
    );
  };

  if (loading) {
    return (
      <AppShell title="Payment Checkout" showBackButton>
        <div className="flex justify-center items-center h-48 pt-[64px]">
          <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
        </div>
      </AppShell>
    );
  }

  const transitLocation = farmData?.district ? `${farmData.district} Transit` : 'Plot 1 Transit';

  return (
    <AppShell title="Payment Checkout" showBackButton>
      <main className="flex flex-col w-full pt-[8px] pb-32 px-margin bg-surface flex-1">
        
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-md flex flex-col gap-space-sm border border-surface-container">
          <div className="flex justify-between items-start">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Order Summary</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface truncate" title={cartData.title}>{cartData.title}</h2>
            </div>
            <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-space-xs py-0.5 rounded flex-shrink-0 font-bold">Verified FPO</span>
          </div>
          
          <div className="flex items-center gap-space-xs overflow-x-auto py-space-xs no-scrollbar">
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[18px]">agriculture</span>
              <span className="font-label-sm text-label-sm text-on-surface truncate max-w-[120px]">{cartData.equipmentName}</span>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined text-secondary text-[18px]">grain</span>
              <span className="font-label-sm text-label-sm text-on-surface truncate max-w-[120px]">{cartData.productName}</span>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined text-tertiary text-[18px]">local_shipping</span>
              <span className="font-label-sm text-label-sm text-on-surface">{transitLocation}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-space-xs pt-space-xs">
            <div className="flex justify-between items-start text-on-surface-variant font-body-sm text-body-sm">
              <span className="pr-4">{cartData.equipmentName}</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold shrink-0">₹{cartData.equipmentPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-start text-on-surface-variant font-body-sm text-body-sm mt-1">
              <span className="pr-4">{cartData.productName}</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold shrink-0">₹{cartData.productPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm mt-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span>Transit to {transitLocation}</span>
                <span className="bg-surface-container-high text-on-surface-variant text-[11px] font-bold px-1.5 py-0.5 rounded">FPO Subsidized</span>
              </div>
              <span className="font-label-md text-label-md text-primary font-bold">{cartData.transitCost === 0 ? 'FREE' : `₹${cartData.transitCost}`}</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm mt-1">
              <span>GST &amp; Agri Cess (5%)</span>
              <span className="font-label-md text-label-md text-on-surface">₹{cartData.gstAmount.toLocaleString()}</span>
            </div>
            {cartData.fpoDiscount > 0 && (
              <div className="flex justify-between items-center text-primary font-body-sm text-body-sm mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[16px]">redeem</span>
                  Kisan FPO Member Benefit
                </span>
                <span className="font-label-md text-label-md font-bold">-₹{cartData.fpoDiscount.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="bg-surface-container-low p-space-sm rounded-xl mt-space-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Net Payable Total</span>
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold tracking-tight">₹{cartData.total.toLocaleString()}</span>
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
              Payment remains safely locked in our RBI-regulated escrow account. Vendor is paid only after physical delivery &amp; quality check.
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
                <label className={`font-label-sm text-label-sm font-medium ${upiError ? 'text-error' : 'text-on-surface-variant'}`}>Enter your VPA / UPI ID <span className="text-error">*</span></label>
                <div className={`flex items-center gap-space-xs bg-surface-container-low rounded-xl px-space-sm py-1 ${upiError ? 'border border-error' : ''}`}>
                  <span className={`material-symbols-outlined text-[20px] ${upiError ? 'text-error' : 'text-on-surface-variant'}`}>account_balance_wallet</span>
                  <input 
                    className={`bg-transparent flex-1 font-label-md text-label-md outline-none py-2 w-full ${upiError ? 'text-error' : 'text-on-surface'}`} 
                    placeholder="username@upi" 
                    type="text" 
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value);
                      if(upiError) setUpiError('');
                    }}
                  />
                  <button className="bg-primary-container text-on-primary-container px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm font-bold active:scale-95 transition-transform" type="button">Verified</button>
                </div>
                {upiError && (
                  <span className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {upiError}
                  </span>
                )}
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
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Subsidized interest rate eligible</span>
                  <div className="mt-space-xs flex items-center gap-space-xs">
                    <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded font-bold">Pre-approved: ₹{kccLimit.toLocaleString()}</span>
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
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Available Balance: ₹{walletBalance.toLocaleString()}</span>
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
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Pay driver directly via Cash or UPI at {transitLocation}</span>
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

      <div className="fixed bottom-0 left-0 right-0 p-space-md bg-surface-container-lowest/95 backdrop-blur-md z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-space-md">
          <div className="flex flex-col min-w-0">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Amount to Pay</span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-md text-headline-md text-primary font-bold">₹{cartData.total.toLocaleString()}</span>
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
    </AppShell>
  );
}
