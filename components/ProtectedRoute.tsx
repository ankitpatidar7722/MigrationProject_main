import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { ModuleName } from '../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    module?: ModuleName; // Optional: Only allow if user has 'View' permission for this module
    requiredRole?: string; // Optional: Only allow specific role (e.g. Admin)
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, module, requiredRole }) => {
    const { user, loading, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-[#050505]">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        // User logged in but doesn't have required role
        return <Navigate to="/" replace />; // Or detailed 403 page
    }

    if (module && !hasPermission(module, 'View')) {
        // User logged in but no permission for this module
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
