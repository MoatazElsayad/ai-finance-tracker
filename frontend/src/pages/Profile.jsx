/**
 * User Profile Page
 * Dark Mode Finance Tracker - Professional user profile with user information & avatar
 */
import { useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile } from '../api'; // Adjust import path as needed
import { User, Mail, Calendar, Shield, Edit, Save, X, Upload } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // success / error

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* Header / Hero Section */}
      <section className="relative pt-16 pb-24 px-6 bg-gradient-to-br from-[#1a1f3a] via-[#0f172a] to-[#0a0e27]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            {/* Avatar Section */}
            <div className="mb-6 relative inline-block">
              <div className="inline-block p-1.5 bg-gradient-to-br from-amber-400/30 to-purple-500/20 rounded-full">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border-4 border-amber-400/40 shadow-2xl overflow-hidden">
                  {user && <UserAvatar user={user} size="w-32 h-32" />}
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {user ? `${user.last_name}, ${user.first_name}` : 'Your Profile'}
            </h1>
            <p className="text-xl text-slate-400 mb-8">
              Manage your account information
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 -mt-16 relative z-10">
        {/* Main Profile Card */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
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
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Shield className="w-7 h-7 text-amber-400" strokeWidth={1.8} />
                Account Information
              </h2>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/70 hover:bg-slate-600 rounded-lg text-amber-400 hover:text-amber-300 transition-colors border border-slate-600 hover:border-amber-500/40"
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
                    className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors border border-slate-600"
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
                  <label className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all"
                      placeholder="John"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-700/50 rounded-lg text-white border border-slate-600">
                      {user?.first_name || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all"
                      placeholder="Doe"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-700/50 rounded-lg text-white border border-slate-600">
                      {user?.last_name || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Username */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Username
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all"
                      placeholder="Your username"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-700/50 rounded-lg text-white border border-slate-600">
                      {user?.username || '—'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all"
                      placeholder="your@email.com"
                      disabled // usually email shouldn't be editable without verification
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-700/50 rounded-lg text-white border border-slate-600">
                      {user?.email || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-700/50 rounded-lg text-white border border-slate-600">
                    {user?.phone || '—'}
                  </div>
                )}
              </div>

              {/* Join Date */}
              <div className="pt-6 border-t border-slate-700">
                <div className="flex items-center gap-3 text-slate-400">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="text-sm">Member since</p>
                    <p className="text-white font-medium">
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
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;