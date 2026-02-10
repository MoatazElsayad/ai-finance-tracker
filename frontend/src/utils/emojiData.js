export const EMOJI_CATEGORIES = [
  { id: 'popular', name: 'Popular', icon: 'Star', emojis: ['💰', '🍔', '🚗', '🏠', '🛍️', '🛒', '🍽️', '🎮', '🏥', '✈️', '🎓', '💼'] },
  { id: 'money', name: 'Money & Finance', icon: 'Banknote', emojis: ['💰', '💵', '💸', '💳', '📈', '📉', '🏦', '🪙', '📊', '🏦', '💎', '🧾'] },
  { id: 'food', name: 'Food & Drink', icon: 'Utensils', emojis: ['🍔', '🍕', '🥗', '🍲', '☕', '🍺', '🍦', '🍩', '🍎', '🍣', '🍹', '🍷'] },
  { id: 'transport', name: 'Transport', icon: 'Car', emojis: ['🚗', '🚌', '🚇', '🚲', '🚕', '✈️', '🚂', '⛽', '🚢', '🚀', '🛴', '🛵'] },
  { id: 'home', name: 'Home', icon: 'Home', emojis: ['🏠', '🏢', '🔑', '💡', '🚰', '🛋️', '🛏️', '🚿', '🚪', '🏘️', '🏡', '🏚️'] },
  { id: 'health', name: 'Health', icon: 'Activity', emojis: ['🏥', '💊', '💪', '🩺', '🩹', '🏃', '🧘', '🦷', '🍎', '🥗', '🧼', '🧴'] },
  { id: 'entertainment', name: 'Entertainment', icon: 'Gamepad2', emojis: ['🎮', '🎬', '🍿', '🎧', '🎭', '🎨', '🎤', '🎟️', '🎪', '🎲', '🎹', '🎸'] },
  { id: 'education', name: 'Education', icon: 'GraduationCap', emojis: ['🎓', '📚', '📝', '🏫', '✏️', '🖍️', '🎒', '📖', '🧪', '🎨', '📏', '📎'] },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', emojis: ['🛍️', '🛒', '👕', '👠', '💄', '📱', '💻', '⌚', '🎁', '🎈', '💍', '🕶️'] },
  { id: 'travel', name: 'Travel', icon: 'Plane', emojis: ['✈️', '🏨', '🏝️', '🌍', '🏔️', '🗺️', '📸', '🎒', '🚢', '🚆', '🚠', '🎫'] },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal', emojis: ['📦', '🏷️', '🔄', '🐾', '🍼', '🧸', '👶', '💄', '💅', '💆', '🧽', '🧼', '🧺', '🔧', '🔨', '🔒'] }
];

export const SMART_SUGGESTIONS = [
  { keywords: ['food', 'restaurant', 'coffee', 'cafe', 'meal', 'grocery', 'pizza', 'burger', 'eat', 'dinner', 'lunch', 'breakfast'], emojis: ['🍔', '🍕', '☕', '🛒', '🥗', '🍲'] },
  { keywords: ['salary', 'stipend', 'income', 'pay', 'bonus', 'freelance', 'cash', 'wage', 'earn'], emojis: ['💰', '💸', '💳', '📈', '💵', '🤑'] },
  { keywords: ['university', 'tuition', 'college', 'school', 'study', 'education', 'course', 'book', 'scholarship'], emojis: ['🎓', '📚', '🏫', '📝', '📖'] },
  { keywords: ['rent', 'house', 'home', 'apartment', 'mortgage', 'stay'], emojis: ['🏠', '💡', '🔑', '🏢', '🛋️'] },
  { keywords: ['transport', 'car', 'uber', 'taxi', 'bus', 'train', 'fuel', 'gas', 'parking', 'commute'], emojis: ['🚗', '🚌', '⛽', '🚇', '🚕'] },
  { keywords: ['shop', 'shopping', 'mall', 'clothes', 'fashion', 'store', 'retail', 'buy'], emojis: ['🛍️', '🛒', '👕', '👠', '👗'] },
  { keywords: ['bill', 'utility', 'electric', 'water', 'internet', 'phone', 'wifi', 'subscription'], emojis: ['💡', '🚰', '📱', '📶', '🧾'] },
  { keywords: ['health', 'doctor', 'hospital', 'medicine', 'pharmacy', 'fitness', 'gym', 'workout'], emojis: ['🏥', '💊', '💪', '🩺', '🏃'] },
  { keywords: ['entertain', 'movie', 'cinema', 'netflix', 'game', 'games', 'fun', 'hobby', 'play'], emojis: ['🎮', '🎬', '🍿', '🎧', '🎭'] },
  { keywords: ['travel', 'flight', 'hotel', 'trip', 'vacation', 'holiday', 'tour'], emojis: ['✈️', '🏨', '🏝️', '🌍', '📸'] },
  { keywords: ['pet', 'dog', 'cat', 'animal'], emojis: ['🐶', '🐱', '🐾', '🐹'] },
  { keywords: ['gift', 'present', 'birthday', 'celebration'], emojis: ['🎁', '🎈', '🎉', '🍰'] },
  { keywords: ['investment', 'stock', 'crypto', 'bitcoin', 'trading'], emojis: ['📈', '📊', '🪙', '💎', '📉'] }
];

export const getSmartSuggestions = (name) => {
  if (!name || name.length < 2) return ['💰', '📊', '🛍️', '💳'];
  
  const lowerName = name.toLowerCase();
  const match = SMART_SUGGESTIONS.find(s => 
    s.keywords.some(k => lowerName.includes(k))
  );
  
  return match ? match.emojis : ['💰', '📊', '🛍️', '💳'];
};
