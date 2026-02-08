/**
 * Theme Context
 * Karanlık/Aydınlık mod ve özel tema yönetimi
 */

import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Tema tanımları
const themes = {
    dark: {
        name: 'Karanlık',
        bgPrimary: '#0f172a',
        bgSecondary: '#1e293b',
        bgCard: 'rgba(255, 255, 255, 0.1)',
        textPrimary: '#ffffff',
        textSecondary: '#94a3b8',
        accent: '#8b5cf6',
        accentHover: '#7c3aed',
        border: 'rgba(255, 255, 255, 0.2)',
        glassBg: 'rgba(255, 255, 255, 0.1)',
    },
    light: {
        name: 'Aydınlık',
        bgPrimary: '#f8fafc',
        bgSecondary: '#e2e8f0',
        bgCard: 'rgba(0, 0, 0, 0.05)',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
        accent: '#7c3aed',
        accentHover: '#6d28d9',
        border: 'rgba(0, 0, 0, 0.1)',
        glassBg: 'rgba(255, 255, 255, 0.7)',
    },
    neon: {
        name: 'Neon',
        bgPrimary: '#0a0a0a',
        bgSecondary: '#1a1a2e',
        bgCard: 'rgba(0, 255, 136, 0.05)',
        textPrimary: '#00ff88',
        textSecondary: '#00cc6a',
        accent: '#ff00ff',
        accentHover: '#cc00cc',
        border: 'rgba(0, 255, 136, 0.3)',
        glassBg: 'rgba(0, 255, 136, 0.1)',
    },
    sunset: {
        name: 'Gün Batımı',
        bgPrimary: '#1a1a2e',
        bgSecondary: '#16213e',
        bgCard: 'rgba(255, 107, 107, 0.1)',
        textPrimary: '#ffeaa7',
        textSecondary: '#dfe6e9',
        accent: '#ff6b6b',
        accentHover: '#ee5a5a',
        border: 'rgba(255, 107, 107, 0.3)',
        glassBg: 'rgba(255, 107, 107, 0.1)',
    },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    // LocalStorage'dan tema tercihini oku
    const [currentTheme, setCurrentTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app-theme');
            return saved && themes[saved] ? saved : 'dark';
        }
        return 'dark';
    });

    // CSS değişkenlerini güncelle
    useEffect(() => {
        const theme = themes[currentTheme];
        const root = document.documentElement;

        root.style.setProperty('--bg-primary', theme.bgPrimary);
        root.style.setProperty('--bg-secondary', theme.bgSecondary);
        root.style.setProperty('--bg-card', theme.bgCard);
        root.style.setProperty('--text-primary', theme.textPrimary);
        root.style.setProperty('--text-secondary', theme.textSecondary);
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--accent-hover', theme.accentHover);
        root.style.setProperty('--border-color', theme.border);
        root.style.setProperty('--glass-bg', theme.glassBg);

        // Body background güncelle
        document.body.style.backgroundColor = theme.bgPrimary;
        document.body.style.color = theme.textPrimary;

        // LocalStorage'a kaydet
        localStorage.setItem('app-theme', currentTheme);
    }, [currentTheme]);

    const setTheme = (themeName) => {
        if (themes[themeName]) {
            setCurrentTheme(themeName);
        }
    };

    const toggleTheme = () => {
        const themeKeys = Object.keys(themes);
        const currentIndex = themeKeys.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        setCurrentTheme(themeKeys[nextIndex]);
    };

    const value = {
        currentTheme,
        theme: themes[currentTheme],
        themes,
        setTheme,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
