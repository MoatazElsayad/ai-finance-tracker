/**
 * User Profile Page
 * Dark Mode Finance Tracker - Professional user profile with user information & avatar
 */
import { useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile, generateReport } from '../api'; // Adjust import path as needed
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Calendar, Shield, Edit, Save, X, Upload, FileText, ArrowLeftRight } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

function Profile() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
      <div className={`flex justify-center items-center min-h-screen ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-lg`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-6 py-8 transition-colors duration-500 ${isDark ? 'bg-[#0a0e27]' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 animate-in fade-in slide-in-from-top-10 duration-700">
        <div>
          <h1 className="text-header-unified flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-xl shadow-amber-500/20">
              <User className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <span className="uppercase tracking-[0.2em]">Profile</span>
          </h1>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 text-lg font-medium max-w-2xl`}>
            Manage your account information and preferences with professional precision.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
        {/* Main Profile Card */}
        <div className={`card-unified ${isDark ? 'card-unified-dark' : 'card-unified-light'} !p-8 md:!p-12`}>
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Avatar & Hero Section */}
            <div className="flex flex-col md:flex-row items-center gap-10 mb-16 pb-16 border-b-2 border-slate-500/10">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
                <div className={`relative w-48 h-48 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center border-4 border-amber-500 shadow-2xl overflow-hidden transform group-hover:scale-105 transition-transform duration-500`}>
                  {user && <UserAvatar user={user} size="w-48 h-48" />}
                </div>
              </div>
              
              <div className="text-center md:text-left">
                <h2 className={`text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                  {user ? `${user.first_name} ${user.last_name}` : 'Your Name'}
                </h2>
                <p className={`text-2xl font-black ${isDark ? 'text-amber-500' : 'text-amber-600'} mb-6 uppercase tracking-[0.2em]`}>
                  @{user?.username || 'username'}
                </p>
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] ${
                  isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'
                } border-2 border-slate-700/5 shadow-sm`}>
                  <Shield className="w-5 h-5 text-amber-500" strokeWidth={2.5} />
                  Verified Account
                </div>
              </div>
            </div>

            {/* Message banner */}
            {message.text && (
              <div className={`mb-12 p-8 rounded-[2rem] text-center font-black uppercase tracking-[0.2em] animate-in slide-in-from-top-4 duration-500 shadow-xl ${
                message.type === 'success' 
                  ? 'bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-500'
                  : 'bg-rose-500/10 border-2 border-rose-500/20 text-rose-500'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-8 mb-16">
              <h3 className={`text-3xl font-black tracking-[0.2em] uppercase ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-6`}>
                <div className="p-4 bg-amber-500/10 rounded-2xl border-2 border-amber-500/20 shadow-lg shadow-amber-500/5">
                  <User className="w-8 h-8 text-amber-500" strokeWidth={3} />
                </div>
                Account Details
              </h3>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center gap-4 px-10 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 group active:scale-95 ${
                    isDark 
                      ? 'bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-white border-2 border-slate-700/50 shadow-xl shadow-black/20 hover:shadow-amber-500/20' 
                      : 'bg-white text-amber-600 hover:bg-amber-500 hover:text-white border-2 border-slate-200 shadow-lg hover:shadow-amber-500/10'
                  }`}
                >
                  <Edit className="w-6 h-6 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setMessage({ text: '', type: '' });
                    }}
                    className={`px-10 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 active:scale-95 ${
                      isDark 
                        ? 'bg-slate-800 text-slate-400 hover:text-white border-2 border-slate-700/50 shadow-xl shadow-black/20' 
                        : 'bg-white text-slate-500 hover:text-slate-900 border-2 border-slate-200 shadow-lg'
                    }`}
                  >
                    <X className="w-6 h-6 inline mr-2" strokeWidth={2.5} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="btn-primary-unified !rounded-[1.5rem] !py-5 !px-10 shadow-2xl shadow-amber-500/20 disabled:opacity-50 group active:scale-95"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Save className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                        <span className="tracking-[0.2em]">SAVE CHANGES</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className={`block text-xs font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`input-unified w-full !text-xl ${isDark ? 'input-unified-dark' : 'input-unified-light'}`}
                      placeholder="John"
                    />
                  ) : (
                    <div className={`px-8 py-6 rounded-[1.5rem] font-black text-xl transition-all duration-500 ${isDark ? 'bg-slate-800/30 border-slate-700/50 text-white hover:bg-slate-800/50' : 'bg-slate-50/50 border-slate-200 text-slate-900 hover:bg-slate-100/50'} border-2 shadow-inner group`}>
                      <span className="group-hover:text-amber-500 transition-colors">{user?.first_name || '—'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className={`block text-xs font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={`input-unified w-full !text-xl ${isDark ? 'input-unified-dark' : 'input-unified-light'}`}
                      placeholder="Doe"
                    />
                  ) : (
                    <div className={`px-8 py-6 rounded-[1.5rem] font-black text-xl transition-all duration-500 ${isDark ? 'bg-slate-800/30 border-slate-700/50 text-white hover:bg-slate-800/50' : 'bg-slate-50/50 border-slate-200 text-slate-900 hover:bg-slate-100/50'} border-2 shadow-inner group`}>
                      <span className="group-hover:text-amber-500 transition-colors">{user?.last_name || '—'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className={`block text-xs font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`input-unified w-full !text-xl ${isDark ? 'input-unified-dark' : 'input-unified-light'}`}
                      placeholder="Your username"
                    />
                  ) : (
                    <div className={`px-8 py-6 rounded-[1.5rem] font-black text-xl transition-all duration-500 ${isDark ? 'bg-slate-800/30 border-slate-700/50 text-white hover:bg-slate-800/50' : 'bg-slate-50/50 border-slate-200 text-slate-900 hover:bg-slate-100/50'} border-2 shadow-inner group`}>
                      <span className="group-hover:text-amber-500 transition-colors">{user?.username || '—'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className={`block text-xs font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email Address</label>
                  <div className={`px-8 py-6 rounded-[1.5rem] font-black text-xl transition-all duration-500 ${isDark ? 'bg-slate-800/20 border-slate-700/30 text-slate-500 hover:bg-slate-800/30' : 'bg-slate-50/20 border-slate-200 text-slate-400 hover:bg-slate-100/20'} border-2 flex items-center gap-4 shadow-inner group`}>
                    <Mail className="w-6 h-6 opacity-50 group-hover:text-amber-500 group-hover:opacity-100 transition-all" />
                    <span className="group-hover:text-amber-500 transition-colors">{user?.email || '—'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className={`block text-xs font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`input-unified w-full !text-xl ${isDark ? 'input-unified-dark' : 'input-unified-light'}`}
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <div className={`px-8 py-6 rounded-[1.5rem] font-black text-xl transition-all duration-500 ${isDark ? 'bg-slate-800/30 border-slate-700/50 text-white hover:bg-slate-800/50' : 'bg-slate-50/50 border-slate-200 text-slate-900 hover:bg-slate-100/50'} border-2 shadow-inner group`}>
                      <span className="group-hover:text-amber-500 transition-colors">{user?.phone || '—'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className={`block text-xs font-black uppercase tracking-[0.2em] ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gender</label>
                  {isEditing ? (
                    <div className="relative group">
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className={`input-unified w-full !text-xl appearance-none pr-12 ${isDark ? 'input-unified-dark' : 'input-unified-light'}`}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500 transition-transform group-hover:scale-110">
                        <ArrowLeftRight className="w-6 h-6 rotate-90" />
                      </div>
                    </div>
                  ) : (
                    <div className={`px-8 py-6 rounded-[1.5rem] font-black text-xl transition-all duration-500 ${isDark ? 'bg-slate-800/30 border-slate-700/50 text-white hover:bg-slate-800/50' : 'bg-slate-50/50 border-slate-200 text-slate-900 hover:bg-slate-100/50'} border-2 shadow-inner group`}>
                      <span className="group-hover:text-amber-500 transition-colors">{user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '—'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Join Date */}
              <div className="pt-12 border-t-2 border-slate-500/10 flex items-center justify-between">
                <div className="flex items-center gap-6 group">
                  <div className={`p-4 rounded-2xl transition-all duration-500 ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700/50 group-hover:bg-slate-700 group-hover:text-amber-500' : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-white group-hover:text-amber-500'} border-2 shadow-sm`}>
                    <Calendar className="w-8 h-8 transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Member Since</p>
                    <p className={`text-2xl font-black transition-colors ${isDark ? 'text-white group-hover:text-amber-500' : 'text-slate-900 group-hover:text-amber-500'}`}>
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
            
            {/* Reports Section */}
            <div className="mt-20 pt-20 border-t-2 border-slate-500/10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-12">
                <h3 className={`text-3xl font-black tracking-[0.2em] uppercase ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-6`}>
                  <div className="p-4 bg-amber-500/10 rounded-2xl border-2 border-amber-500/20 shadow-lg shadow-amber-500/5">
                    <FileText className="w-8 h-8 text-amber-500" strokeWidth={3} />
                  </div>
                  Financial Reports
                </h3>
                
                <div className={`p-2 rounded-[1.5rem] ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'} border-2 border-slate-500/10 flex gap-2 w-fit shadow-inner`}>
                  {['monthly', 'yearly', 'overall'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setReportViewMode(mode)}
                      className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 active:scale-95 ${
                        reportViewMode === mode
                          ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/30 scale-105'
                          : `${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/30' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button
                  onClick={() => handleDownloadProfileReport('pdf')}
                  className={`flex items-center justify-between p-8 rounded-[2rem] border-2 transition-all duration-500 group shadow-lg active:scale-[0.98] ${
                    isDark 
                      ? 'bg-slate-800/30 border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-800 shadow-black/20' 
                      : 'bg-white border-slate-100 hover:border-amber-500/50 hover:bg-slate-50 shadow-slate-200/50'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl transition-all duration-500 ${isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-amber-500' : 'bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-amber-500'} border-2 border-transparent group-hover:border-amber-500/20`}>
                      <FileText className="w-8 h-8 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="text-left">
                      <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Download</p>
                      <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-amber-500 transition-colors`}>PDF Report</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl transition-all duration-500 ${isDark ? 'bg-slate-800 text-slate-500 group-hover:bg-amber-500 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-amber-500 group-hover:text-white'}`}>
                    <Upload className="w-6 h-6 rotate-180 transition-transform group-hover:scale-110" />
                  </div>
                </button>

                <button
                  onClick={() => handleDownloadProfileReport('csv')}
                  className={`flex items-center justify-between p-8 rounded-[2rem] border-2 transition-all duration-500 group shadow-lg active:scale-[0.98] ${
                    isDark 
                      ? 'bg-slate-800/30 border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-800 shadow-black/20' 
                      : 'bg-white border-slate-100 hover:border-amber-500/50 hover:bg-slate-50 shadow-slate-200/50'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl transition-all duration-500 ${isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-amber-500' : 'bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-amber-500'} border-2 border-transparent group-hover:border-amber-500/20`}>
                      <FileText className="w-8 h-8 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="text-left">
                      <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Download</p>
                      <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-amber-500 transition-colors`}>CSV Export</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl transition-all duration-500 ${isDark ? 'bg-slate-800 text-slate-500 group-hover:bg-amber-500 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-amber-500 group-hover:text-white'}`}>
                    <Upload className="w-6 h-6 rotate-180 transition-transform group-hover:scale-110" />
                  </div>
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
