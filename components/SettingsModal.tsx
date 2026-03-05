import React from 'react';
import { useTheme, ThemeMode, ColorMode } from '../services/ThemeContext';
import { useLanguage } from '../services/LanguageContext';
import { X, Check } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { theme, updateTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();

    if (!isOpen) return null;



    const PRESET_THEMES = [
        { name: 'Default', sidebar: '#0f294d', primary: '#3b82f6', secondary: '#94a3b8' },
        { name: 'Forest', sidebar: '#064e3b', primary: '#10b981', secondary: '#a7f3d0' },
        { name: 'Crimson', sidebar: '#7f1d1d', primary: '#ef4444', secondary: '#fca5a5' },
        { name: 'Royal', sidebar: '#4c1d95', primary: '#8b5cf6', secondary: '#ddd6fe' },
        { name: 'Sunset', sidebar: '#7c2d12', primary: '#f97316', secondary: '#fed7aa' },
        { name: 'Midnight', sidebar: '#000000', primary: '#64748b', secondary: '#cbd5e1' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{t('Settings')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Language Section */}
                    <section>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('Language')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${language === 'en'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
                                    }`}
                            >
                                <span className="text-lg mr-2">🇺🇸</span> {t('English')}
                            </button>
                            <button
                                onClick={() => setLanguage('hi')}
                                className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${language === 'hi'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
                                    }`}
                            >
                                <span className="text-lg mr-2">🇮🇳</span> {t('Hindi')}
                            </button>
                        </div>
                    </section>

                    {/* Theme Mode Section */}
                    <section>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('Mode')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => updateTheme({ mode: 'light' })}
                                className={`p-3 rounded-xl border-2 transition-all ${theme.mode === 'light'
                                    ? 'border-blue-500 bg-white text-slate-800 shadow-sm'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                                    }`}
                            >
                                {t('Light Mode')}
                            </button>
                            <button
                                onClick={() => updateTheme({ mode: 'dark' })}
                                className={`p-3 rounded-xl border-2 transition-all ${theme.mode === 'dark'
                                    ? 'border-blue-500 bg-zinc-900 text-white shadow-sm'
                                    : 'border-slate-200 bg-slate-100 text-slate-500'
                                    }`}
                            >
                                {t('Dark Mode')}
                            </button>
                        </div>
                    </section>

                    {/* Appearance Section */}
                    <section>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('Theme')}</h3>



                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {PRESET_THEMES.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => updateTheme({
                                        primaryColor: preset.primary,
                                        sidebarColor: preset.sidebar,
                                        secondaryColor: preset.secondary,
                                        colorMode: 'solid'
                                    })}
                                    className={`relative group border-2 rounded-xl p-2 transition-all hover:shadow-lg ${theme.primaryColor === preset.primary && theme.sidebarColor === preset.sidebar
                                        ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                                        : 'border-transparent hover:border-slate-200 dark:hover:border-zinc-700 bg-slate-50 dark:bg-zinc-800'
                                        }`}
                                >
                                    <div className="flex h-12 w-full rounded-lg overflow-hidden mb-3 ring-1 ring-black/5 dark:ring-white/5">
                                        <div className="flex-1" style={{ backgroundColor: preset.sidebar }}></div>
                                        <div className="flex-1" style={{ backgroundColor: preset.primary }}></div>
                                        <div className="flex-1" style={{ backgroundColor: preset.secondary }}></div>
                                    </div>
                                    <div className="flex items-center justify-between px-1">
                                        <span className={`text-sm font-medium ${theme.primaryColor === preset.primary && theme.sidebarColor === preset.sidebar
                                            ? 'text-blue-700 dark:text-blue-300'
                                            : 'text-slate-700 dark:text-slate-300'
                                            }`}>
                                            {preset.name}
                                        </span>
                                        {theme.primaryColor === preset.primary && theme.sidebarColor === preset.sidebar && (
                                            <Check size={16} className="text-blue-600 dark:text-blue-400" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
