/**
 * User Profile Page
 * Dark Mode Finance Tracker - Professional user profile with user information & avatar
 */
import { useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile, generateReport } from '../api'; // Adjust import path as needed
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Calendar, Shield, Edit, Save, X, Upload } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

function Profile() {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    gender: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // success / error
  const [reportViewMode, setReportViewMode] = useState('monthly');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          phone: userData.phone || '',
          gender: userData.gender || '',
        });
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setMessage({ text: 'Failed to load profile data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // You need to implement updateUserProfile in api.js
      const updated = await updateUserProfile(formData);
      setUser(updated);
      setIsEditing(false);
      setMessage({ text: 'Profile updated successfully', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      console.error('Profile update failed:', err);
      setMessage({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };
  
  const getReportDateRange = () => {
    const now = new Date();
    if (reportViewMode === 'monthly') {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate, endDate };
    } else if (reportViewMode === 'yearly') {
      const startDate = new Date(now.getFullYear(), 0, 1);
      const endDate = new Date(now.getFullYear(), 11, 31);
      return { startDate, endDate };
    }
    return { startDate: new Date(1900, 0, 1), endDate: new Date(2100, 11, 31) };
  };
  
  const handleDownloadProfileReport = async (format = 'pdf') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to download reports.');
        return;
      }
      const { startDate, endDate } = getReportDateRange();
      const payload = {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        format,
      };
      const { blob, filename } = await generateReport(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-lg`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'} pb-20`}>
      {/* Header / Hero Section */}
      <section className={`relative pt-16 pb-24 px-6 ${theme === 'dark' ? 'bg-gradient-to-br from-[#1a1f3a] via-[#0f172a] to-[#0a0e27]' : 'bg-gradient-to-br from-slate-100 via-white to-slate-50'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            {/* Avatar Section */}
            <div className="mb-6 relative inline-block">
              <div className="inline-block p-1.5 bg-gradient-to-br from-amber-400/30 to-purple-500/20 rounded-full">
                <div className={`w-32 h-32 rounded-full ${theme === 'dark' ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gradient-to-br from-slate-200 to-slate-300'} flex items-center justify-center border-4 border-amber-400/40 shadow-2xl overflow-hidden`}>
                  {user && <UserAvatar user={user} size="w-32 h-32" />}
                </div>
              </div>
            </div>

            <h1 className={`text-4xl md:text-5xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-3`}>
              {user ? `${user.last_name}, ${user.first_name}` : 'Your Profile'}
            </h1>
            <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-8`}>
              Manage your account information
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 -mt-16 relative z-10">
        {/* Main Profile Card */}
        <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-slate-700' : 'bg-gradient-to-br from-white via-slate-50 to-white border-slate-200'} rounded-3xl shadow-2xl border overflow-hidden`}>
          <div className="p-8 md:p-10">
            {/* Message banner */}
            {message.text && (
              <div className={`mb-8 p-4 rounded-xl text-center font-medium ${
                message.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                  : 'bg-red-500/20 border border-red-500/30 text-red-300'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-between items-center mb-10">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
                <Shield className={`w-7 h-7 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.8} />
                Account Information
              </h2>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 ${theme === 'dark' ? 'bg-slate-700/70 hover:bg-slate-600 border-slate-600 hover:border-amber-500/40' : 'bg-slate-200/70 hover:bg-slate-300 border-slate-300 hover:border-amber-400/40'} rounded-lg text-amber-400 hover:text-amber-300 transition-colors border`}
                >
                  <Edit className="w-5 h-5" strokeWidth={2.2} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setMessage({ text: '', type: '' });
                    }}
                    className={`px-5 py-2.5 ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300 hover:text-white' : 'bg-slate-300 hover:bg-slate-400 border-slate-400 text-slate-700 hover:text-slate-900'} rounded-lg transition-colors border`}
                  >
                    <X className="w-5 h-5 inline mr-1.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 rounded-lg font-medium shadow-lg disabled:opacity-50 transition-all"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" strokeWidth={2.2} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* First Name & Last Name */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-2 flex items-center gap-2`}>
                    <User className="w-4 h-4" />
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all`}
                      placeholder="John"
                    />
                  ) : (
                    <div className={`px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} rounded-lg border`}>
                      {user?.first_name || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-2 flex items-center gap-2`}>
                    <User className="w-4 h-4" />
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all`}
                      placeholder="Doe"
                    />
                  ) : (
                    <div className={`px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} rounded-lg border`}>
                      {user?.last_name || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Username */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-2 flex items-center gap-2`}>
                    <User className="w-4 h-4" />
                    Username
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all`}
                      placeholder="Your username"
                    />
                  ) : (
                    <div className={`px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} rounded-lg border`}>
                      {user?.username || '—'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-2 flex items-center gap-2`}>
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all`}
                      placeholder="your@email.com"
                      disabled // usually email shouldn't be editable without verification
                    />
                  ) : (
                    <div className={`px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} rounded-lg border`}>
                      {user?.email || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-2 flex items-center gap-2`}>
                  <Mail className="w-4 h-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all`}
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <div className={`px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} rounded-lg border`}>
                    {user?.phone || '—'}
                  </div>
                )}
              </div>
              
              {/* Gender */}
              <div>
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-2 flex items-center gap-2`}>
                  <User className="w-4 h-4" />
                  Gender
                </label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                ) : (
                  <div className={`px-4 py-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-100/50 border-slate-300 text-slate-900'} rounded-lg border`}>
                    {user?.gender || '—'}
                  </div>
                )}
              </div>

              {/* Join Date */}
              <div className={`pt-6 ${theme === 'dark' ? 'border-t border-slate-700' : 'border-t border-slate-300'}`}>
                <div className={`flex items-center gap-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="text-sm">Member since</p>
                    <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-medium`}>
                      {user?.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </form>
            
            <div className={`mt-10 ${theme === 'dark' ? 'border-t border-slate-700 pt-8' : 'border-t border-slate-300 pt-8'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Reports</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportViewMode('monthly')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      reportViewMode === 'monthly'
                        ? 'bg-blue-500/80 text-white'
                        : theme === 'dark'
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setReportViewMode('yearly')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      reportViewMode === 'yearly'
                        ? 'bg-blue-500/80 text-white'
                        : theme === 'dark'
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    Yearly
                  </button>
                  <button
                    onClick={() => setReportViewMode('overall')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      reportViewMode === 'overall'
                        ? 'bg-blue-500/80 text-white'
                        : theme === 'dark'
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    Overall
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleDownloadProfileReport('pdf')}
                  className={`${theme === 'dark' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'} rounded-lg px-4 py-2 font-medium transition-all`}
                >
                  Download PDF Report
                </button>
                <button
                  onClick={() => handleDownloadProfileReport('csv')}
                  className={`${theme === 'dark' ? 'bg-slate-700/60 text-slate-200 hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'} rounded-lg px-4 py-2 font-medium transition-all`}
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
