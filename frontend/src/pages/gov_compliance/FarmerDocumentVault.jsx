import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument, getDocuments } from '../../api/govComplianceApi';

export default function FarmerDocumentVault() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('land_record');

  const fetchDocuments = async () => {
    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      const res = await getDocuments(farmId);
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

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
      formData.append('doc_type', selectedDocType);
      formData.append('file', file);
      
      const res = await uploadDocument(formData);
      setDocuments(prev => [res.data, ...prev]);
      alert('Document uploaded and scanned successfully!');
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

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-[96px] pb-24 px-margin bg-surface flex-1 gap-space-md">
        
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
              {documents.length} Records Uploaded
            </span>
            <span className="text-primary font-bold bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full">
              {documents.length > 0 ? 'Subsidy Ready' : 'Upload Required'}
            </span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary-container h-full rounded-full" style={{ width: `${Math.min(documents.length * 20, 100)}%` }}></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
            <span>256-Bit Encrypted Vault</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Verified Documents</h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Tap to inspect, share QR pass, or refresh sync</p>
          </div>
          <span className="font-label-sm text-label-sm text-primary font-bold bg-surface-container-low px-2.5 py-1 rounded-full">
            {documents.length} Records
          </span>
        </div>

        <div className="space-y-space-md">
          {isLoading && <div className="text-center p-4">Loading documents...</div>}
          
          {!isLoading && documents.length === 0 && (
            <div className="bg-surface-container-low rounded-xl p-6 text-center text-on-surface-variant">
              No documents found. Upload one to get started.
            </div>
          )}

          {documents.map((doc) => (
            <div key={doc.document_id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[26px]">
                      {doc.doc_type === 'land_record' ? 'landscape' : doc.doc_type === 'aadhaar' ? 'badge' : 'description'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-label-lg text-label-lg text-on-surface capitalize">{doc.doc_type.replace('_', ' ')}</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1 ${doc.verified ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-on-surface'}`}>
                  <span className="material-symbols-outlined text-[12px]">{doc.verified ? 'check' : 'pending'}</span>
                  {doc.verified ? 'Verified' : 'Pending Review'}
                </span>
              </div>

              <div className="bg-surface-container-low rounded-lg p-3 space-y-1 font-label-sm">
                <h4 className="text-on-surface font-semibold mb-2">OCR Extracted Data:</h4>
                {doc.ocr_extracted && Object.entries(doc.ocr_extracted).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-on-surface-variant capitalize">{key.replace('_', ' ')}:</span>
                    <span className="text-on-surface font-medium truncate max-w-[200px] text-right">{val}</span>
                  </div>
                ))}
                {(!doc.ocr_extracted || Object.keys(doc.ocr_extracted).length === 0) && (
                  <div className="text-on-surface-variant italic">No data could be extracted.</div>
                )}
              </div>
              
        <div className="flex items-center justify-between font-label-sm text-label-sm pt-1 w-full overflow-hidden">
                <span className="text-outline truncate mr-2" title={doc.file_path.replace(/\\/g, '/').split('/').pop()}>
                  File: {doc.file_path.replace(/\\/g, '/').split('/').pop()}
                </span>
                <button 
                  className="text-primary font-semibold flex items-center gap-1 hover:underline active:opacity-80" 
                  type="button"
                  onClick={() => window.open(
                    import.meta.env.VITE_API_URL 
                      ? `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/${doc.file_path.replace(/\\/g, '/').replace('backend/', '')}`
                      : `http://localhost:8000/${doc.file_path.replace(/\\/g, '/').replace('backend/', '')}`
                    , '_blank'
                  )}
                >
                  <span>View Details</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-3 pt-2 z-20 flex flex-col gap-3 bg-surface p-3 rounded-xl shadow-lg border border-surface-container-high mt-4">
          <label className="text-on-surface-variant font-label-sm px-1">Select Document Type:</label>
          <select 
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="w-full h-14 px-4 rounded-xl bg-surface-container text-on-surface font-label-md outline-none"
          >
            <option value="land_record">Land Record (7/12)</option>
            <option value="aadhaar">Identity (Aadhaar)</option>
            <option value="bank_passbook">Bank Passbook</option>
            <option value="insurance">Insurance Policy</option>
          </select>
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
            className="w-full h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform font-label-lg text-label-lg font-bold disabled:opacity-70" 
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">
              {isUploading ? 'sync' : 'camera_enhance'}
            </span>
            <span className={isUploading ? 'animate-pulse' : ''}>
              {isUploading ? 'Scanning via OCR...' : 'Scan New Document'}
            </span>
          </button>
        </div>
      </main>

      
    </div>
  );
}
