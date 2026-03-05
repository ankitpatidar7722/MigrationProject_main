import React, { createContext, useContext, useState, useCallback } from 'react';

interface RefreshContextType {
    registerRefresh: (callback: () => Promise<void> | void) => void;
    triggerRefresh: () => Promise<void>;
    isRefreshing: boolean;
}

const RefreshContext = createContext<RefreshContextType | null>(null);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [refreshCallback, setRefreshCallback] = useState<(() => Promise<void> | void) | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const registerRefresh = useCallback((callback: () => Promise<void> | void) => {
        setRefreshCallback(() => callback);
    }, []);

    const triggerRefresh = useCallback(async () => {
        if (refreshCallback) {
            setIsRefreshing(true);
            try {
                await refreshCallback();
            } catch (error) {
                console.error('Error during refresh:', error);
            } finally {
                setIsRefreshing(false);
            }
        }
    }, [refreshCallback]);

    return (
        <RefreshContext.Provider value={{ registerRefresh, triggerRefresh, isRefreshing }}>
            {children}
        </RefreshContext.Provider>
    );
};

export const useRefresh = () => {
    const context = useContext(RefreshContext);
    if (!context) {
        throw new Error('useRefresh must be used within a RefreshProvider');
    }
    return context;
};
