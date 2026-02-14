import { useTheme } from '../contexts/useTheme';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { 
      id: 'light', 
      name: 'Light', 
      icon: '☀️',
      description: 'Bright and clean'
    },
    { 
      id: 'dark', 
      name: 'Dark', 
      icon: '🌙',
      description: 'Easy on the eyes'
    },
    { 
      id: 'mixed', 
      name: 'Mixed', 
      icon: '🎨',
      description: 'Playful hybrid'
    },
    { 
      id: 'system', 
      name: 'System', 
      icon: '💻',
      description: 'Match your OS'
    },
  ];

  return (
    <div className="relative group">
      {/* Current Theme Button */}
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
        aria-label="Change theme"
      >
        <span className="text-2xl">
          {themes.find(t => t.id === theme)?.icon || '💻'}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
          Theme
        </span>
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-2">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 uppercase tracking-wide">
            Choose Theme
          </div>
          {themes.map((themeOption) => (
            <button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 ${
                theme === themeOption.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-2xl">{themeOption.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{themeOption.name}</div>
                <div className="text-xs opacity-70">{themeOption.description}</div>
              </div>
              {theme === themeOption.id && (
                <span className="text-blue-600 dark:text-blue-400">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
