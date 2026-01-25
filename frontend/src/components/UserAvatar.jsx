/**
 * UserAvatar Component
 * Displays user avatar using DiceBear API (no backend storage needed)
 */

import { useTheme } from '../context/ThemeContext';

function UserAvatar({ user, size = "w-10 h-10", showName = false }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Use username as seed for consistent avatar
  const seed = user?.username || user?.email || "anonymous";
  
  // DiceBear API URL with avataaars style
  // Format: https://api.dicebear.com/9.x/{style}/svg?seed={seed}
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&scale=80`;

  return (
    <div className="flex items-center gap-3">
      <img
        src={avatarUrl}
        alt={`${user?.first_name || user?.username}'s avatar`}
        className={`${size} rounded-full object-cover border-2 ${isDark ? 'border-amber-400/30' : 'border-amber-500/20'} shadow-md flex-shrink-0 transition-transform duration-300 hover:scale-110`}
        loading="lazy"
        onError={(e) => {
          // Fallback to a simple color-based avatar if image fails to load
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.first_name || user?.username || 'U')}&background=f59e0b&color=fff&size=128`;
        }}
      />
      {showName && (
        <div className="flex flex-col">
          <span className={`font-black text-[9px] uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}
          </span>
          <span className={`text-[8px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'} tracking-tight`}>{user?.email}</span>
        </div>
      )}
    </div>
  );
}

export default UserAvatar;
