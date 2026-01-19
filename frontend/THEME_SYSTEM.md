# Light & Dark Mode Theme System

## Overview

The AI Finance Tracker now supports a comprehensive light and dark mode theme system. Users can toggle between themes using the button in the navigation bar.

## Architecture

### ThemeContext (`src/context/ThemeContext.jsx`)
- Provides global theme state management
- Persists theme preference to localStorage
- Automatically detects system preference on first visit
- Exports `ThemeProvider` and `useTheme` hook

### Theme Colors (`src/utils/themeColors.js`)
- Centralized color definitions for both themes
- Organized by category (background, text, border, accent)
- Helper function `getThemeClass()` for dynamic styling

### CSS Variables (`src/index.css`)
- CSS custom properties for colors in both modes
- Applied to `:root` (dark mode) and `:root.light` (light mode)
- Enables pure CSS theme switching without JavaScript overhead

## Usage

### In Components

```jsx
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={theme === 'dark' ? 'bg-slate-900' : 'bg-white'}>
      <button onClick={toggleTheme}>
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>
    </div>
  );
}
```

### Theme-Aware Styling Pattern

```jsx
<div className={`
  p-4 rounded-lg
  ${theme === 'dark' 
    ? 'bg-slate-800 text-white border-slate-700' 
    : 'bg-white text-slate-900 border-slate-200'
  }
`}>
  Content here
</div>
```

## Theme Toggle

The theme toggle button is located in the navigation bar (top-right corner):
- Shows a **☀️ Sun** icon in dark mode
- Shows a **🌙 Moon** icon in light mode
- Click to instantly switch between themes

## Persistence

- Theme preference is automatically saved to localStorage
- On page reload, the user's previously selected theme is restored
- System preference is used as fallback for first-time visitors

## Pages Converted

✅ **Dashboard** - Full theme support with color-adaptive cards and charts
✅ **Transactions** - Theme support for forms and summary cards
✅ **Budget** - Theme support for planning interface
✅ **Navigation Bar** - Theme toggle button integrated

## Best Practices

1. **Always use ternary operators** for theme-dependent classes:
   ```jsx
   className={`${theme === 'dark' ? 'dark-class' : 'light-class'}`}
   ```

2. **Group related colors** when applying theme:
   ```jsx
   className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}
   ```

3. **Test both modes** when adding new components or styling

4. **Consider contrast** - ensure sufficient contrast in both themes for accessibility

## Color Palette

### Dark Mode
- **Primary Background**: #0a0e27
- **Secondary Background**: slate-800/slate-900
- **Text Primary**: white
- **Text Secondary**: slate-400
- **Borders**: slate-700

### Light Mode
- **Primary Background**: slate-50
- **Secondary Background**: white
- **Text Primary**: slate-900
- **Text Secondary**: slate-600
- **Borders**: slate-200

## Future Enhancements

- [ ] Custom color themes (beyond light/dark)
- [ ] Scheduled theme switching (auto-switch at sunset/sunrise)
- [ ] More granular theme customization for users
- [ ] Theme persistence across sync to backend
