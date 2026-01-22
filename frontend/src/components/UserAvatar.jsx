/**
 * UserAvatar Component
 * Displays user avatar using DiceBear API (no backend storage needed)
 */

function UserAvatar({ user, size = "w-10 h-10", showName = false }) {
  // Use user.avatar if available, otherwise fallback to seed based on username
  const seed = user?.username || user?.email || "anonymous";
  
  // DiceBear API URL with avataaars style
  // Format: https://api.dicebear.com/9.x/{style}/svg?seed={seed}
  const avatarUrl = user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&scale=80`;

  return (
    <div className="flex items-center gap-3">
      <img
        src={avatarUrl}
        alt={`${user?.first_name || user?.username}'s avatar`}
        className={`${size} rounded-full object-cover border-2 border-amber-400/30 shadow-md flex-shrink-0`}
        loading="lazy"
        onError={(e) => {
          // Fallback to a simple color-based avatar if image fails to load
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.first_name || user?.username || 'U')}&background=0D8ABC&color=fff&size=128`;
        }}
      />
      {showName && (
        <div className="flex flex-col">
          <span className="font-semibold text-white text-sm">
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}
          </span>
          <span className="text-xs text-slate-400">{user?.email}</span>
        </div>
      )}
    </div>
  );
}

export default UserAvatar;
