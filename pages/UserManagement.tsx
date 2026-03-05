import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { User } from '../types';
import { UserForm } from './UserForm';
import { Plus, Search, Edit2, Trash2, Shield, User as UserIcon } from 'lucide-react';

const UserManagement: React.FC = () => {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

    const loadUsers = async () => {
        try {
            const data = await api.users.getAll();
            setUsers(data || []);
        } catch (err) {
            console.error('Failed to load users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreate = () => {
        setEditingUser(undefined);
        setShowForm(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await api.users.delete(id);
                loadUsers();
            } catch (err) {
                alert('Failed to delete user.');
            }
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        loadUsers();
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.firstName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Shield size={32} />
                        </div>
                        User Management
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-400 mt-1 ml-14">
                        Manage system users and access permissions.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    {hasPermission('User', 'Create') && (
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={18} />
                            Create User
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                    <div key={user.userId} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${user.role === 'Admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                    {user.firstName ? user.firstName[0] : user.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{user.firstName} {user.lastName}</h3>
                                    <p className="text-slate-500 text-sm">@{user.username}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                                {user.role}
                            </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                            {hasPermission('User', 'Edit') && (
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                            )}
                            {hasPermission('User', 'Delete') && (
                                <button
                                    onClick={() => handleDelete(user.userId)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <UserForm
                    user={editingUser}
                    onClose={() => setShowForm(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};

export default UserManagement;
