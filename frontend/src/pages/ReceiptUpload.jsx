import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Upload, Camera, Check, AlertCircle, Loader, ArrowRight, RefreshCw } from 'lucide-react';

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

      const response = await fetch(`${API_URL}/ocr/upload-receipt`, {
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
      const response = await fetch(`${API_URL}/ocr/confirm-receipt`, {
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
        <div className={`text-center p-8 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-lg max-w-md w-full`}>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
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
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              View Transactions
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className={`flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                isDark 
                  ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-2xl mx-auto ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'} min-h-screen`}>
      <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Receipt Scanner
      </h1>

      {/* Upload Section */}
      {!extractedData && (
        <div className={`rounded-lg p-8 mb-6 border-2 border-dashed transition-colors ${
          isDark ? 'border-slate-600 bg-slate-800/30 hover:bg-slate-800/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        } cursor-pointer`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <Upload className={`w-12 h-12 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <div className="text-center">
              <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Drop receipt image here
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                or click to browse
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Camera Button */}
      {!extractedData && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={`rounded-lg p-8 flex flex-col items-center gap-4 ${
          isDark ? 'bg-slate-800' : 'bg-white'
        }`}>
          <Loader className={`w-8 h-8 animate-spin ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
            Analyzing receipt...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={`rounded-lg p-4 flex gap-3 mb-6 ${
          isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <p className={isDark ? 'text-red-200' : 'text-red-800'}>{error}</p>
        </div>
      )}

      {/* Preview Image */}
      {previewImage && (
        <div className="mb-6 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
          <img src={previewImage} alt="Receipt preview" className="w-full max-h-96 object-contain" />
        </div>
      )}

      {/* Extracted Data Form */}
      {extractedData && (
        <div className={`rounded-lg p-6 mb-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Check className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <p className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              Receipt analyzed (Confidence: {Math.round(extractedData.confidence)}%)
            </p>
          </div>

          <div className="space-y-4">
            {/* Merchant */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Merchant Name
              </label>
              <input
                type="text"
                value={editData.merchant}
                onChange={(e) => setEditData({ ...editData, merchant: e.target.value })}
                className={`w-full px-3 py-2 rounded border transition-colors ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-amber-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                } focus:outline-none`}
              />
            </div>

            {/* Amount */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                className={`w-full px-3 py-2 rounded border transition-colors ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-amber-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                } focus:outline-none`}
              />
            </div>

            {/* Date */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Date
              </label>
              <input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                className={`w-full px-3 py-2 rounded border transition-colors ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-amber-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                } focus:outline-none`}
              />
            </div>

            {/* Category */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Category
              </label>
              <select
                value={editData.category_id}
                onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}
                className={`w-full px-3 py-2 rounded border transition-colors ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-amber-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                } focus:outline-none`}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Description (optional)
              </label>
              <input
                type="text"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className={`w-full px-3 py-2 rounded border transition-colors ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-amber-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                } focus:outline-none`}
              />
            </div>

            {/* OCR Text Preview */}
            {extractedData.extracted_text && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Extracted Text
                </label>
                <textarea
                  readOnly
                  value={extractedData.extracted_text}
                  className={`w-full px-3 py-2 rounded border text-xs h-24 ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-slate-300'
                      : 'bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleConfirmReceipt}
              disabled={submitting}
              className={`flex-1 px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-700'
                  : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-400'
              }`}
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Transaction
                </>
              )}
            </button>
            <button
              onClick={() => {
                setExtractedData(null);
                setEditData({ merchant: '', amount: '', date: '', category_id: '', description: '' });
                setPreviewImage(null);
                setError(null);
              }}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                isDark
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info Section */}
      {!extractedData && (
        <div className={`rounded-lg p-6 ${isDark ? 'bg-slate-800' : 'bg-blue-50 border border-blue-200'}`}>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>
            How it works
          </h3>
          <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-300' : 'text-blue-800'}`}>
            <li>📷 Upload or take a photo of your receipt</li>
            <li>🤖 AI automatically extracts merchant, amount, and date</li>
            <li>✏️ Review and adjust the extracted data</li>
            <li>💾 Save as a new transaction</li>
          </ul>
        </div>
      )}
    </div>
  );
}
