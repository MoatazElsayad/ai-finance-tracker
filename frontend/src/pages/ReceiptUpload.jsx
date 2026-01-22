import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Upload, Camera, Check, AlertCircle, Loader, ArrowRight, RefreshCw, ScanLine, DollarSign, Calendar, Tag, FileText, X } from 'lucide-react';

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
      <div className={`p-6 max-w-2xl mx-auto ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} min-h-screen flex flex-col items-center justify-center`}>
        <div className={`text-center p-8 rounded-2xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white shadow-xl'} max-w-md w-full`}>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Transaction Saved!
          </h2>
          <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Your receipt has been successfully processed and added to your transactions.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
            >
              View Transactions
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleReset}
              className={`flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl font-semibold transition-all ${
                isDark 
                  ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-6 py-8 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
              <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-400/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                <ScanLine className="w-8 h-8" />
              </div>
              Smart Receipt Scanner
            </h1>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Upload a receipt and let AI extract the details for you.
            </p>
          </div>
          
          {extractedData && (
             <button
              onClick={() => {
                if (window.confirm('Discard changes and upload new?')) {
                   handleReset();
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              New Upload
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className={`rounded-xl p-4 flex gap-3 mb-6 ${
            isDark ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <p className={`font-medium ${isDark ? 'text-red-200' : 'text-red-800'}`}>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto"><X className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} /></button>
          </div>
        )}

        {/* Main Content Area */}
        {!extractedData && !loading ? (
          // Upload Screen
          <div className="max-w-2xl mx-auto mt-12">
            <div 
              className={`relative group rounded-3xl p-10 border-3 border-dashed transition-all duration-300 cursor-pointer text-center ${
                isDark 
                  ? 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-amber-400/50' 
                  : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-amber-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                isDark ? 'bg-slate-700 text-amber-400' : 'bg-amber-50 text-amber-600'
              }`}>
                <Upload className="w-10 h-10" />
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Click to upload or drag & drop
              </h3>
              <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Supports JPG, PNG, WEBP (Max 10MB)
              </p>
              
              <div className="flex justify-center gap-4">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     fileInputRef.current?.click();
                   }}
                   className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                     isDark ? 'bg-amber-400 text-slate-900 hover:bg-amber-300' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
                   }`}
                 >
                   Select File
                 </button>
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     cameraInputRef.current?.click();
                   }}
                   className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                     isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                   }`}
                 >
                   <Camera className="w-5 h-5" />
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
            
            <div className={`mt-8 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'} text-sm`}>
              <p>Powered by Advanced AI OCR Models</p>
            </div>
          </div>
        ) : loading ? (
          // Loading Screen
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
              <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
              <ScanLine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-amber-400" />
            </div>
            <h3 className={`mt-8 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Analyzing Receipt...
            </h3>
            <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Extracting merchant, date, and amount
            </p>
          </div>
        ) : (
          // Results Split View
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Image Preview */}
            <div className={`sticky top-8 rounded-2xl overflow-hidden shadow-lg border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <h3 className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Original Receipt</h3>
              </div>
              <div className="p-4 bg-slate-900/50 flex justify-center">
                <img 
                  src={previewImage} 
                  alt="Receipt preview" 
                  className="max-h-[600px] w-auto object-contain rounded-lg shadow-sm" 
                />
              </div>
            </div>

            {/* Right Column: Edit Form */}
            <div className={`rounded-2xl shadow-xl border overflow-hidden ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
               <div className={`p-6 border-b ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Review Details</h2>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                      extractedData.confidence > 80 
                        ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                        : (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')
                    }`}>
                      {extractedData.confidence > 80 ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {Math.round(extractedData.confidence)}% Confidence
                    </div>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Please verify the extracted information below before saving.
                  </p>
               </div>

               <div className="p-6 space-y-6">
                  {/* Merchant Input */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Merchant Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      </div>
                      <input
                        type="text"
                        value={editData.merchant}
                        onChange={(e) => setEditData({ ...editData, merchant: e.target.value })}
                        placeholder="e.g. Starbucks"
                        className={`block w-full pl-10 pr-3 py-3 rounded-xl border transition-colors ${
                          isDark
                            ? 'bg-slate-900/50 border-slate-600 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount Input */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Total Amount
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={editData.amount}
                          onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                          placeholder="0.00"
                          className={`block w-full pl-10 pr-3 py-3 rounded-xl border transition-colors ${
                            isDark
                              ? 'bg-slate-900/50 border-slate-600 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Date Input */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Date
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        </div>
                        <input
                          type="date"
                          value={editData.date}
                          onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                          className={`block w-full pl-10 pr-3 py-3 rounded-xl border transition-colors ${
                            isDark
                              ? 'bg-slate-900/50 border-slate-600 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setEditData({ ...editData, category_id: cat.id })}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all text-left ${
                            parseInt(editData.category_id) === cat.id
                              ? (isDark ? 'bg-amber-400/20 border-amber-400 text-amber-400' : 'bg-amber-50 border-amber-500 text-amber-700')
                              : (isDark ? 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description Input */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Description <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                        <FileText className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      </div>
                      <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows="2"
                        placeholder="Add notes about this transaction..."
                        className={`block w-full pl-10 pr-3 py-3 rounded-xl border transition-colors resize-none ${
                          isDark
                            ? 'bg-slate-900/50 border-slate-600 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleConfirmReceipt}
                    disabled={submitting}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Saving Transaction...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Confirm & Save
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