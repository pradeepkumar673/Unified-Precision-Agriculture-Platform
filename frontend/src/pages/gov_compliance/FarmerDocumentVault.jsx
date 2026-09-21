import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument } from '../../api/govComplianceApi';

export default function FarmerDocumentVault() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [showOcrPreview, setShowOcrPreview] = useState(true);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      const formData = new FormData();
      formData.append('farm_id', farmId);
      formData.append('doc_type', 'land_record'); // Mocking the type for demo
      formData.append('file', file);
      
      await uploadDocument(formData);
      alert('Document uploaded and scanned successfully!');
      // In a full implementation, we'd update the OCR live preview with the response data
      setShowOcrPreview(true);
      setOcrConfirmed(false);
    } catch (err) {
      console.error('Failed to upload document', err);
      alert('Failed to upload document.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmOcr = () => {
    setOcrConfirmed(true);
    setTimeout(() => {
      setShowOcrPreview(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-[64px] pb-24 px-margin bg-surface flex-1 gap-space-md">
        
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">shield_lock</span>
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Farmer Document Vault</span>
            </div>
            <p className="font-headline-sm text-headline-sm text-on-surface">Secure Records</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant leading-snug">
              Encrypted credentials for PM-Kisan, KCC credit limits, and mandi gate passes.
            </p>
          </div>
          <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center bg-surface-container rounded-full">
            <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 44 44">
              <circle className="text-surface-container-highest" cx="22" cy="22" fill="none" r="17" stroke="currentColor" strokeWidth="4"></circle>
              <circle className="text-primary-container" cx="22" cy="22" fill="none" r="17" stroke="currentColor" strokeDasharray="106.8" strokeDashoffset="21.36" strokeLinecap="round" strokeWidth="4"></circle>
            </svg>
            <span className="absolute font-label-md text-label-md font-bold text-primary">80%</span>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-3 space-y-2 shadow-xs border border-surface-container/50">
          <div className="flex items-center justify-between font-label-sm text-label-sm">
            <span className="text-on-surface font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              4 of 5 Verified
            </span>
            <span className="text-primary font-bold bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full">
              Tier-1 Subsidy Ready
            </span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary-container h-full rounded-full" style={{ width: '80%' }}></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
            <span>256-Bit Encrypted Vault</span>
          </div>
          <div className="flex items-center gap-1 text-outline">
            <span className="material-symbols-outlined text-[15px]">sync_alt</span>
            <span>DigiLocker &amp; UIDAI</span>
          </div>
        </div>

        {showOcrPreview && (
          <div className={`bg-surface-container-lowest rounded-xl p-space-md shadow-md space-y-space-sm ${ocrConfirmed ? 'transition-all duration-300 opacity-70' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]">document_scanner</span>
                </span>
                <div>
                  <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wide">Live Review</span>
                  <p className="font-label-lg text-label-lg text-on-surface leading-tight">Maharashtra 7/12 Extract</p>
                </div>
              </div>
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                99.4% AI Match
              </span>
            </div>

            <div className="relative w-full h-28 rounded-lg overflow-hidden bg-surface-container">
              <img className="w-full h-full object-cover opacity-85" src="https://images.unsplash.com/photo-1616499370260-485b3e5ed653?q=80&w=1000&auto=format&fit=crop" alt="Scan document" />
              <div className="absolute inset-0 bg-gradient-to-r from-on-surface/40 via-transparent to-transparent"></div>
              <div className="absolute top-3 left-4 right-16 bottom-3 bg-primary/10 rounded p-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-primary font-label-sm text-label-sm font-mono drop-shadow">
                  <span className="bg-primary/80 px-1.5 py-0.5 rounded text-[10px]">PARCEL SCAN BOUNDS</span>
                  <span className="text-[10px]">LIVE REVENUE SYNC</span>
                </div>
                <div className="text-on-primary font-label-sm text-label-sm font-semibold drop-shadow">
                  GAT NO: 142/2A • CULTIVABLE
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-label-sm">
                <span className="text-on-surface-variant font-label-sm">Owner Name</span>
                <span className="text-on-surface font-semibold text-right font-label-sm">Ramesh Shivram Patil <span className="text-primary font-bold">(100%)</span></span>
              </div>
              <div className="w-full h-[1px] bg-surface-container"></div>
              <div className="flex justify-between items-center text-label-sm">
                <span className="text-on-surface-variant font-label-sm">Gat / Survey Number</span>
                <span className="text-on-surface font-semibold text-right font-label-sm">142/2A <span className="text-primary font-bold">(99%)</span></span>
              </div>
              <div className="w-full h-[1px] bg-surface-container"></div>
              <div className="flex justify-between items-center text-label-sm">
                <span className="text-on-surface-variant font-label-sm">Cultivable Area</span>
                <span className="text-on-surface font-semibold text-right font-label-sm">4.50 Acres (1.82 Ha) <span className="text-primary font-bold">(100%)</span></span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-primary font-medium">
              <span className="material-symbols-outlined text-[16px]">cloud_done</span>
              <span>Auto-verified with Maharashtra Bhoomi Portal database</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={handleConfirmOcr}
                className={`flex-1 h-12 rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-transform ${ocrConfirmed ? 'bg-primary text-on-primary' : 'bg-primary-container text-on-primary'}`} 
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {ocrConfirmed ? 'check_circle' : 'save'}
                </span>
                <span>{ocrConfirmed ? 'Saved to Vault!' : 'Confirm & Save to Vault'}</span>
              </button>
              <button className="h-12 px-4 rounded-lg bg-surface-container text-on-surface-variant font-label-md text-label-md font-semibold flex items-center justify-center active:bg-surface-container-high transition-colors" type="button">
                Edit
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Verified Documents</h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Tap to inspect, share QR pass, or refresh sync</p>
          </div>
          <span className="font-label-sm text-label-sm text-primary font-bold bg-surface-container-low px-2.5 py-1 rounded-full">
            5 Records
          </span>
        </div>

        <div className="space-y-space-md">
          
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[26px]">badge</span>
                </div>
                <div>
                  <h3 className="font-label-lg text-label-lg text-on-surface">Aadhaar Card</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Identity &amp; Biometric Auth</p>
                </div>
              </div>
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">check</span>
                Verified
              </span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-3 space-y-1 font-mono text-label-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-sans">UID:</span>
                <span className="text-on-surface font-semibold tracking-wider">•••• •••• 9214</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-on-surface-variant">Name:</span>
                <span className="text-on-surface font-medium">Ramesh Patil</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-on-surface-variant">DOB:</span>
                <span className="text-on-surface font-medium">14/08/1982</span>
              </div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
              <span className="text-outline">Updated 2 mos ago</span>
              <button className="text-primary font-semibold flex items-center gap-1 hover:underline active:opacity-80" type="button">
                <span>View / Re-scan</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[26px]">landscape</span>
                </div>
                <div>
                  <h3 className="font-label-lg text-label-lg text-on-surface">7/12 Land Record</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Bhoomi 8A Live Extract</p>
                </div>
              </div>
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">check</span>
                Verified
              </span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-3 space-y-1 font-label-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Survey No:</span>
                <span className="text-on-surface font-semibold font-mono">142/2A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Total Area:</span>
                <span className="text-on-surface font-medium">4.50 Acres (1.82 Ha)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Location:</span>
                <span className="text-on-surface font-medium truncate max-w-[180px]">Niphad, Nashik, MH</span>
              </div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[14px]">sync</span>
                <span>Bhoomi Portal Sync</span>
              </div>
              <button className="text-primary font-semibold flex items-center gap-1 hover:underline active:opacity-80" type="button">
                <span>View Extract</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[26px]">account_balance</span>
                </div>
                <div>
                  <h3 className="font-label-lg text-label-lg text-on-surface">Bank Passbook</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Direct Benefit Transfer (DBT)</p>
                </div>
              </div>
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">check</span>
                Verified
              </span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-3 space-y-1 font-label-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Bank &amp; Branch:</span>
                <span className="text-on-surface font-medium">SBI Lasalgaon</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-on-surface-variant font-sans">A/C Number:</span>
                <span className="text-on-surface font-semibold tracking-wider">••••••••4891</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-on-surface-variant font-sans">IFSC Code:</span>
                <span className="text-on-surface font-semibold">SBIN0001234</span>
              </div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
              <span className="text-primary font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">currency_rupee</span>
                Active DBT Enabled
              </span>
              <button className="text-primary font-semibold flex items-center gap-1 hover:underline active:opacity-80" type="button">
                <span>View Copy</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[26px]">science</span>
                </div>
                <div>
                  <h3 className="font-label-lg text-label-lg text-on-surface">Soil Health Card</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">ICAR Field Lab Test</p>
                </div>
              </div>
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">check</span>
                Verified
              </span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-3 space-y-1 font-label-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Sample ID:</span>
                <span className="text-on-surface font-mono font-semibold">SHC-2024-NIP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Soil pH:</span>
                <span className="text-on-surface font-medium">7.2 (Neutral / Ideal)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Organic Carbon:</span>
                <span className="text-on-surface font-medium">0.58% (Moderate)</span>
              </div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
              <span className="text-outline">Valid till Nov 2026</span>
              <button className="text-primary font-semibold flex items-center gap-1 hover:underline active:opacity-80" type="button">
                <span>View Card</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="bg-secondary-fixed/30 rounded-xl p-space-md shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[26px]">workspace_premium</span>
                </div>
                <div>
                  <h3 className="font-label-lg text-label-lg text-on-surface">Category Certificate</h3>
                  <p className="font-label-sm text-label-sm text-secondary font-medium">OBC / SC / ST / Minor</p>
                </div>
              </div>
              <span className="bg-secondary-container text-on-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[13px]">warning</span>
                Missing
              </span>
            </div>
            <div className="bg-surface-container-lowest/80 rounded-lg p-3 space-y-1">
              <p className="font-label-sm text-label-sm text-on-secondary-container leading-normal">
                Upload certificate to unlock an additional <strong className="text-secondary font-bold">15% subsidy bonus</strong> on solar pump and drip irrigation programs.
              </p>
            </div>
            <button 
              onClick={handleUploadClick}
              className="w-full bg-surface-container-lowest rounded-lg p-4 flex flex-col items-center justify-center gap-2 active:bg-surface-container transition-colors" 
              type="button"
            >
              <div className="w-10 h-10 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
              </div>
              <div className="text-center">
                <span className="font-label-md text-label-md font-bold text-secondary block">Tap to Scan with Camera / Upload PDF</span>
                <span className="font-label-sm text-label-sm text-outline">Supports DigiLocker, PDF, JPEG (Max 10MB)</span>
              </div>
            </button>
          </div>
        </div>

        <div className="sticky bottom-3 pt-2 z-20">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,.pdf"
          />
          <button 
            disabled={isUploading}
            onClick={handleUploadClick}
            className="w-full h-14 rounded-full bg-secondary-container text-on-secondary shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform font-label-lg text-label-lg font-bold disabled:opacity-70" 
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">
              {isUploading ? 'sync' : 'camera_enhance'}
            </span>
            <span className={isUploading ? 'animate-pulse' : ''}>
              {isUploading ? 'Scanning via OCR...' : 'Scan New Document (Instant AI OCR)'}
            </span>
          </button>
        </div>
      </main>

      
    </div>
  );
}
