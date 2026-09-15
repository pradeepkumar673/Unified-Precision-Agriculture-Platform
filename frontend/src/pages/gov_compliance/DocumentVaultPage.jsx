import { useState, useRef } from 'react';
import axios from 'axios';
import { 
  FileText, UploadCloud, ShieldCheck, CheckCircle, Search, 
  Trash2, RefreshCw, FileImage
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function DocumentVaultPage() {
  const [farmId, setFarmId] = useState('FARM-001');
  const [docType, setDocType] = useState('aadhaar');
  
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState('');

  const savedDocs = [];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setOcrResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    formData.append('farm_id', farmId);

    try {
      const res = await axios.post(`${API_BASE}/api/v1/gov/documents/upload`, formData);
      setOcrResult(res.data.ocr_extracted);
    } catch (err) {
      setError(err.response?.data?.detail || 'OCR failed. Verify that Tesseract is installed and the document is readable.');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    setOcrResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Document Vault & OCR Scanner
          </h1>
          <p className="text-slate-400 mt-1">Digitize identity, land, and financial records for auto-populating gov forms</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scanner Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" /> Upload & Extract
              </h2>
              <select 
                value={docType} onChange={(e) => setDocType(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
              >
                <option value="aadhaar">Aadhaar Card</option>
                <option value="land_record">7/12 Land Record</option>
                <option value="bank_passbook">Bank Passbook</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Uploader / Preview */}
              <div className="flex flex-col">
                {!preview ? (
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="flex-1 min-h-[250px] border-2 border-dashed border-slate-600 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/5 cursor-pointer transition-colors p-6 text-center"
                  >
                    <UploadCloud className="w-12 h-12 mb-4 opacity-75" />
                    <p className="font-medium text-slate-300">Click to upload document</p>
                    <p className="text-xs mt-2">JPEG, PNG, or PDF up to 5MB</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[250px] border border-slate-700 rounded-xl overflow-hidden relative group bg-slate-900 flex items-center justify-center">
                    {file?.type.includes('image') ? (
                      <img src={preview} alt="Document Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center">
                         <FileImage className="w-16 h-16 text-slate-600 mb-2" />
                         <span className="text-slate-400">{file.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button onClick={clearSelection} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
                
                {preview && !ocrResult && (
                  <button 
                    onClick={handleUpload} disabled={loading}
                    className="w-full mt-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin"/> : 'Run OCR Extraction'}
                  </button>
                )}
              </div>

              {/* Extraction Results */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 flex flex-col">
                <h3 className="text-slate-400 text-sm font-medium mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Extraction Results
                </h3>
                
                {!ocrResult ? (
                  <div className="flex-1 flex items-center justify-center text-slate-600 text-sm italic">
                    {loading ? 'Processing via Vision API...' : 'Awaiting document...'}
                  </div>
                ) : (
                  <div className="space-y-4 flex-1">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg flex items-start gap-2 mb-4">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-400">Data successfully extracted and added to your Digital Farm Profile.</p>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(ocrResult).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                          <span className="text-slate-400 text-sm">{key}</span>
                          <span className={`font-medium ${key === 'Confidence' ? 'text-indigo-400' : 'text-white'}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Saved Documents */}
        <div className="lg:col-span-1 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Verified Vault</h2>
          <div className="space-y-3">
            {savedDocs.map(doc => (
              <div key={doc.id} className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:border-indigo-500/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize text-sm">{doc.type.replace('_', ' ')}</p>
                    <p className="text-slate-500 text-xs">{doc.date}</p>
                  </div>
                </div>
                {doc.verified && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              </div>
            ))}
            
            {ocrResult && (
              <div className="bg-slate-900/80 border border-indigo-500/50 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize text-sm">{docType.replace('_', ' ')}</p>
                    <p className="text-slate-500 text-xs text-indigo-400 font-medium">Just added</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
