import React, { useState, useEffect } from 'react';
import { User, UserPermission } from '../types';
import { PermissionMatrix } from '../components/PermissionMatrix';
import { api } from '../services/api';
import { Loader2, X, Save } from 'lucide-react';

interface UserFormProps {
    user?: User; // If provided, edit mode
    onClose: () => void;
    onSuccess: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<Partial<User>>({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        role: 'User',
        isActive: true,
        permissions: [] // Will start empty and be populated by Matrix default logic
    });

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                userId: user.userId,
                username: user.username,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                role: user.role,
                isActive: user.isActive,
                permissions: user.permissions || []
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Include password only if creating or if user typed a new one
            const payload = { ...formData };
            if (password) {
                (payload as any).passwordHash = password; // Map to backend expectance
            }

            if (user && user.userId) {
                await api.users.update(user.userId, payload as User);
            } else {
                await api.users.create(payload as User);
            }
            onSuccess();
        } catch (err) {
            console.error('Failed to save user:', err);
            alert('Failed to save user.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold">{user ? 'Edit User' : 'Create New User'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="user-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-200 border-b pb-2">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Username <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={!!user} // Often username is immutable
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Password {user && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        required={!user}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="User">Standard User</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Permissions Section - Only show for Standard Users */}
                        {formData.role !== 'Admin' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-200 border-b pb-2">Module Authentication</h3>
                                <PermissionMatrix
                                    permissions={formData.permissions || []}
                                    onChange={(newPerms) => setFormData({ ...formData, permissions: newPerms })}
                                />
                            </div>
                        )}
                        {formData.role === 'Admin' && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
                                Admin users have full access to all modules and system settings. Permission matrix is disabled.
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-zinc-900/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-6 py-2.5 text-slate-600 hover:text-slate-800 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="user-form"
                        disabled={loading}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        <Save size={18} />
                        Save User
                    </button>
                </div>
            </div>
        </div>
    );
};
