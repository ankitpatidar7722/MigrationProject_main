import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserPermission, ModuleName } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    hasPermission: (module: ModuleName, action: 'View' | 'Create' | 'Edit' | 'Save' | 'Delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate from local storage on load
        const storedUser = localStorage.getItem('user');
        if (storedUser && storedUser !== "undefined") {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('user');
            }
        } else {
            // BYPASS LOGIN
            const DUMMY_USER: User = {
                userId: 999,
                username: 'Admin',
                email: 'admin@example.com',
                role: 'Admin',
                isActive: true,
                permissions: []
            };
            setUser(DUMMY_USER);
        }
        setLoading(false);
    }, []);

    const login = (userData: User, token: string) => {
        const userWithToken = { ...userData, token };
        setUser(userWithToken);
        localStorage.setItem('user', JSON.stringify(userWithToken));
        localStorage.setItem('token', token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Redirect logic can be handled by consuming components or app router
    };

    const hasPermission = (module: ModuleName, action: 'View' | 'Create' | 'Edit' | 'Save' | 'Delete'): boolean => {
        if (!user) return false;
        if (user.role === 'Admin') return true;

        const perm = user.permissions?.find(p => p.moduleName === module);
        if (!perm) return false;

        switch (action) {
            case 'View': return perm.canView;
            case 'Create': return perm.canCreate;
            case 'Edit': return perm.canEdit;
            case 'Save': return perm.canSave;
            case 'Delete': return perm.canDelete;
            default: return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
