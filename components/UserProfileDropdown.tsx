import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { useLanguage } from '../services/LanguageContext';
import { useTheme } from '../services/ThemeContext';
import { LogOut, Settings, User as UserIcon, Shield } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export const UserProfileDropdown: React.FC = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { currentGradient } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setIsOpen(false);
        logout();
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 focus:outline-none"
            >
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md transition-transform hover:scale-105"
                    style={{ background: currentGradient }}
                >
                    {user.username.charAt(0).toUpperCase()}
                </div>
                {/* Optional: Show name on large screens, hidden on small */}
                {/* <span className="hidden md:block font-medium text-slate-700 dark:text-slate-200">{user.username}</span> */}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    {/* Header with gradient */}
                    <div className="p-6 pb-8 relative" style={{ background: currentGradient }}>
                        <div className="flex gap-4 items-center relative z-10">
                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold text-white shadow-inner border border-white/30">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-white">
                                <h3 className="font-bold text-lg leading-tight">{user.username}</h3>
                                <p className="text-white/80 text-xs truncate max-w-[140px]">{user.email || 'No email'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 -mt-4 relative z-20">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-2 shadow-sm border border-slate-100 dark:border-zinc-800/50">
                            <div className="px-3 py-2 mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'Admin'
                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    }`}>
                                    {user.role === 'Admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                                    {user.role === 'Admin' ? t('Administrator') : t('Standard User')}
                                </span>
                            </div>

                            <button
                                onClick={() => { setIsOpen(false); setShowSettings(true); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <Settings size={18} />
                                {t('Settings')}
                            </button>

                            <div className="my-1 border-t border-slate-100 dark:border-zinc-800"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                            >
                                <LogOut size={18} />
                                {t('Logout')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </div>
    );
};
