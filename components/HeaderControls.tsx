import React from 'react';
import { useLanguage } from '../services/LanguageContext';
import { useTheme } from '../services/ThemeContext';
import { Sun, Moon, Languages } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
    const { theme, updateTheme } = useTheme();
    const isDark = theme.mode === 'dark';

    return (
        <button
            onClick={() => updateTheme({ mode: isDark ? 'light' : 'dark' })}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

export const LanguageToggle: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'hi' : 'en');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all font-medium text-sm"
            title="Switch Language"
        >
            <Languages size={20} />
            <span>{language === 'en' ? 'EN' : 'HI'}</span>
        </button>
    );
};
