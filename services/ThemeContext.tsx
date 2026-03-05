import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ColorMode = 'solid' | 'gradient';

interface ThemeSettings {
    mode: ThemeMode;
    colorMode: ColorMode;
    primaryColor: string;
    secondaryColor: string;
    gradientStart: string;
    gradientEnd: string;
    sidebarColor: string;
}

interface ThemeContextType {
    theme: ThemeSettings;
    updateTheme: (newTheme: Partial<ThemeSettings>) => void;
    currentGradient: string;
}

const defaultTheme: ThemeSettings = {
    mode: 'light',
    colorMode: 'solid',
    primaryColor: '#3b82f6', // blue-500
    secondaryColor: '#1e40af', // blue-800
    gradientStart: '#3b82f6',
    gradientEnd: '#8b5cf6',
    sidebarColor: '#0f294d'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeSettings>(() => {
        const saved = localStorage.getItem('app_theme');
        return saved ? JSON.parse(saved) : defaultTheme;
    });

    useEffect(() => {
        localStorage.setItem('app_theme', JSON.stringify(theme));

        // Apply Dark Mode Class
        if (theme.mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Apply CSS Variables for dynamic coloring
        const root = document.documentElement;
        root.style.setProperty('--primary-color', theme.primaryColor);
        root.style.setProperty('--sidebar-color', theme.sidebarColor);
        root.style.setProperty('--gradient-start', theme.gradientStart);
        root.style.setProperty('--gradient-end', theme.gradientEnd);

    }, [theme]);

    const updateTheme = (newSettings: Partial<ThemeSettings>) => {
        setTheme(prev => ({ ...prev, ...newSettings }));
    };

    const currentGradient = theme.colorMode === 'gradient'
        ? `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`
        : theme.primaryColor;

    return (
        <ThemeContext.Provider value={{ theme, updateTheme, currentGradient }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
