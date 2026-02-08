/**
 * Theme Switcher Component
 * Tema değiştirme butonu
 */

import { useTheme } from '../contexts/ThemeContext';

export default function ThemeSwitcher() {
    const { currentTheme, themes, setTheme, toggleTheme } = useTheme();

    // Tema ikonları
    const themeIcons = {
        dark: '🌙',
        light: '☀️',
        neon: '💚',
        sunset: '🌅',
    };

    return (
        <div className="relative group">
            {/* Ana buton */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                }}
                title={`Tema: ${themes[currentTheme].name}`}
            >
                <span className="text-xl">{themeIcons[currentTheme]}</span>
            </button>

            {/* Dropdown menü */}
            <div
                className="absolute right-0 mt-2 w-40 rounded-lg shadow-xl opacity-0 invisible 
                   group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                }}
            >
                {Object.entries(themes).map(([key, theme]) => (
                    <button
                        key={key}
                        onClick={() => setTheme(key)}
                        className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors
                       first:rounded-t-lg last:rounded-b-lg
                       ${currentTheme === key ? 'font-bold' : ''}`}
                        style={{
                            color: currentTheme === key ? 'var(--accent)' : 'var(--text-primary)',
                            backgroundColor: currentTheme === key ? 'var(--bg-card)' : 'transparent',
                        }}
                    >
                        <span>{themeIcons[key]}</span>
                        <span>{theme.name}</span>
                        {currentTheme === key && <span className="ml-auto">✓</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}
