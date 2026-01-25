import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Upload, Camera, Check, AlertTriangle, Loader, ArrowRight, RefreshCw, ScanLine, Calendar, Tag, FileText, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ReceiptUpload() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editData, setEditData] = useState({
    merchant: '',
    amount: '',
    date: '',
    category_id: '',
    description: ''
  });
  const [categories, setCategories] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    fetch(`${API_URL}/categories?token=${localStorage.getItem('token')}`)
      .then(res => res.json().catch(() => []))
      .then(data => setCategories(data || []))
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processImage(file);
  };

  const processImage = async (file) => {
    setLoading(true);
    setError(null);
    setExtractedData(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/ocr/upload-receipt?token=${localStorage.getItem('token')}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json().catch(() => null);

      if (result && result.success) {
        setExtractedData(result.data);
        setEditData({
          merchant: result.data.merchant,
          amount: result.data.amount || '',
          date: result.data.date,
          category_id: result.data.category_id,
          description: ''
        });
      } else {
        setError((result && result.error) || 'Failed to extract receipt data');
      }
    } catch (err) {
      setError(err.message || 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!editData.merchant || !editData.amount || !editData.date || !editData.category_id) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/ocr/confirm-receipt?token=${localStorage.getItem('token')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          merchant: editData.merchant,
          amount: parseFloat(editData.amount),
          date: editData.date,
          category_id: parseInt(editData.category_id),
          description: editData.description
        })
      });

      const result = await response.json().catch(() => null);
      if (result.success) {
        // Reset form
        setExtractedData(null);
        setEditData({
          merchant: '',
          amount: '',
          date: '',
          category_id: '',
          description: ''
        });
        setPreviewImage(null);
        setShowSuccess(true);
      } else {
        setError(result.error || 'Failed to save transaction');
      }
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setShowSuccess(false);
    setExtractedData(null);
    setPreviewImage(null);
    setError(null);
  };

  if (showSuccess) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} flex items-center justify-center px-4 py-8 transition-colors duration-500`}>
        <div className="max-w-xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} p-8 text-center shadow-2xl relative overflow-hidden`}>
            {/* Decorative element */}
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Check className="w-20 h-20" />
            </div>

            <div className="inline-flex items-center justify-center p-3 bg-emerald-500 rounded-2xl mb-4 shadow-xl shadow-emerald-500/20 rotate-3">
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
            
            <h2 className={`text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>
              Transaction <span className="text-emerald-500">Saved!</span>
            </h2>
            
            <p className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-6`}>
              Your receipt has been successfully processed and added to your intelligent hub.
            </p>
            
            <div className="flex flex-col gap-3 relative z-10">
              <button
                onClick={() => navigate('/transactions')}
                className="w-full py-3 bg-amber-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-amber-600 hover:shadow-2xl hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/10 group"
              >
                <span>View Transactions</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={handleReset}
                className={`w-full py-3 ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'} rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 group`}
              >
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span>Upload Another</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} px-4 py-8 transition-colors duration-500 relative overflow-hidden`}>
      {/* Global Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-600/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="max-w-6xl mx-auto animate-in fade-in duration-700 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="animate-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center justify-center p-2 bg-amber-500 rounded-xl mb-3 shadow-lg shadow-amber-500/20">
              <ScanLine className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h1 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Smart <span className="text-amber-500">Scanner</span>
            </h1>
            <p className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Let AI extract financial intelligence from your receipts.
            </p>
          </div>
          
          {extractedData && (
             <button
              onClick={() => {
                if (window.confirm('Discard changes and upload new?')) {
                   handleReset();
                }
              }}
              className={`px-4 py-2 ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 border-2 border-slate-100 hover:bg-slate-50'} rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center gap-3 shadow-lg animate-in slide-in-from-right-8 duration-700`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Upload
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border-2 border-rose-500/20 rounded-[1.5rem] text-rose-500 text-sm font-black uppercase tracking-[0.2em] flex items-center gap-4 animate-in shake duration-500">
            <AlertTriangle className="w-6 h-6" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-rose-500/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {!extractedData && !loading ? (
          // Upload Screen
          <div className="max-w-3xl mx-auto mt-6 animate-in slide-in-from-bottom-12 duration-1000">
            <div 
              className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} relative group p-8 border-4 border-dashed transition-all duration-500 cursor-pointer text-center ${
                isDark 
                  ? 'border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80' 
                  : 'border-slate-200 hover:border-amber-500/50 hover:bg-white'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {/* Decorative background icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                <FileText className="w-32 h-32" />
              </div>

              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl ${
                isDark ? 'bg-slate-700 text-amber-400 shadow-amber-400/10' : 'bg-amber-50 text-amber-600 shadow-amber-600/10'
              }`}>
                <Upload className="w-6 h-6" strokeWidth={2.5} />
              </div>
              
              <h3 className={`text-xl font-black tracking-tighter mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Drop your <span className="text-amber-500">Receipt</span> here
              </h3>
              <p className={`text-sm font-bold tracking-tight mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                JPG, PNG, or WEBP up to 10MB
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     fileInputRef.current?.click();
                   }}
                   className="px-6 py-3 bg-amber-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-amber-600 hover:shadow-2xl hover:shadow-amber-500/30 transition-all shadow-xl shadow-amber-500/10"
                 >
                   Select File
                 </button>
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     cameraInputRef.current?.click();
                   }}
                   className={`px-6 py-3 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3`}
                 >
                   <Camera className="w-4 h-4" />
                   Camera
                 </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <div className={`mt-8 text-center ${isDark ? 'text-slate-600' : 'text-slate-400'} flex items-center justify-center gap-4`}>
              <div className="h-px w-10 bg-current opacity-20"></div>
              <p className="font-black uppercase tracking-[0.2em] text-[10px]">Neural Intelligence Powered</p>
              <div className="h-px w-10 bg-current opacity-20"></div>
            </div>
          </div>
        ) : loading ? (
          // Loading Screen
          <div className="flex flex-col items-center justify-center min-h-[40vh] animate-in fade-in duration-500">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-[2rem] border-4 border-slate-200/10 dark:border-slate-700/30"></div>
              <div className="absolute top-0 left-0 w-20 h-20 rounded-[2rem] border-4 border-amber-500 border-t-transparent animate-spin duration-[1.5s]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanLine className="w-8 h-8 text-amber-500 animate-pulse" />
              </div>
            </div>
            <h3 className={`text-xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Analyzing <span className="text-amber-500">Intelligence</span>
            </h3>
            <p className={`mt-3 text-sm font-bold tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Extracting merchant, date, and amount...
            </p>
          </div>
        ) : (
          // Results Split View
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in slide-in-from-bottom-8 duration-1000">
            {/* Left Column: Image Preview */}
            <div className={`sticky top-8 card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} overflow-hidden shadow-2xl`}>
              <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Original Receipt
                </h3>
              </div>
              <div className="p-4 bg-slate-950/20 flex justify-center">
                <div className="relative group">
                  <img 
                    src={previewImage} 
                    alt="Receipt preview" 
                    className="max-h-[500px] w-auto object-contain rounded-2xl shadow-2xl border-2 border-white/5" 
                  />
                  <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Right Column: Edit Form */}
            <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} shadow-2xl overflow-hidden`}>
               <div className={`px-6 py-4 border-b ${isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className={`text-lg font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Review <span className="text-amber-500">Details</span>
                    </h2>
                    <div className={`px-2 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg ${
                      extractedData.confidence > 80 
                        ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                        : (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-700')
                    }`}>
                      {extractedData.confidence > 80 ? <Check className="w-3 h-3" strokeWidth={3} /> : <AlertTriangle className="w-3 h-3" />}
                      {Math.round(extractedData.confidence)}% Confidence
                    </div>
                  </div>
                  <p className={`text-xs font-bold tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Verify the AI-extracted intelligence before final commit.
                  </p>
               </div>

               <div className="p-6 space-y-4">
                  {/* Merchant Input */}
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                      Merchant Name
                    </label>
                    <div className="relative group">
                      <Tag className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-amber-500 transition-colors`} />
                      <input
                        type="text"
                        value={editData.merchant}
                        onChange={(e) => setEditData({ ...editData, merchant: e.target.value })}
                        placeholder="Starbucks"
                        className="input-unified w-full pl-12 pr-6 py-3"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount Input */}
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                        Total Amount (EGP)
                      </label>
                      <div className="relative group">
                        <span className={`absolute left-5 top-1/2 -translate-y-1/2 font-black text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-amber-500 transition-colors`}>
                          £
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={editData.amount}
                          onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                          placeholder="0.00"
                          className="input-unified w-full pl-12 pr-6 py-3"
                        />
                      </div>
                    </div>

                    {/* Date Input */}
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                        Transaction Date
                      </label>
                      <div className="relative group">
                        <Calendar className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-amber-500 transition-colors`} />
                        <input
                          type="date"
                          value={editData.date}
                          onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                          className="input-unified w-full pl-12 pr-6 py-3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                      Financial Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setEditData({ ...editData, category_id: cat.id })}
                          className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all text-left group ${
                            parseInt(editData.category_id) === cat.id
                              ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                              : isDark 
                                ? 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50' 
                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`text-base transition-transform group-hover:scale-125 duration-300 ${parseInt(editData.category_id) === cat.id ? 'scale-110' : ''}`}>
                            {cat.icon}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description Input */}
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>
                      Additional Context <span className="opacity-50 font-bold">(Optional)</span>
                    </label>
                    <div className="relative group">
                      <FileText className={`absolute left-5 top-4 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-amber-500 transition-colors`} />
                      <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows="2"
                        placeholder="Add notes..."
                        className="input-unified w-full pl-12 pr-6 py-3 resize-none"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleConfirmReceipt}
                    disabled={submitting}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-amber-600 hover:shadow-2xl hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-amber-500/10 group"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 group-hover:scale-125 transition-transform" strokeWidth={3} />
                        <span>Confirm & Save</span>
                      </>
                    )}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}