import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ModuleMaster } from '../types';
import { Plus, Search, Trash2, Edit3, Loader2, Save, X, Database, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRefresh } from '../services/RefreshContext';
import { useAuth } from '../services/AuthContext';

const ModuleMasterManager: React.FC = () => {
    const [modules, setModules] = useState<ModuleMaster[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingModule, setEditingModule] = useState<ModuleMaster | null>(null);

    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    // Form State
    const [formData, setFormData] = useState<Partial<ModuleMaster>>({
        moduleName: '',
        subModuleName: '',
        groupIndex: 1
    });

    const { hasPermission } = useAuth();
    const { registerRefresh } = useRefresh();

    const loadModules = async () => {
        try {
            const data = await api.moduleMaster.getAll();
            setModules(data);
        } catch (err) {
            console.error('Error loading modules:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadModules();
        registerRefresh(loadModules);
        return () => registerRefresh(() => { });
    }, [registerRefresh]);

    const handleEdit = (module: ModuleMaster) => {
        setEditingModule(module);
        setFormData({
            moduleName: module.moduleName,
            subModuleName: module.subModuleName,
            groupIndex: module.groupIndex
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this module? It may affect existing checks.')) {
            try {
                await api.moduleMaster.delete(id);
                await loadModules();
            } catch (err) {
                console.error('Error deleting module:', err);
                alert('Failed to delete module.');
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.moduleName || !formData.subModuleName) {
            alert('Module Name and Sub Module Name are required.');
            return;
        }

        setSaving(true);
        try {
            const payload: ModuleMaster = {
                moduleId: editingModule?.moduleId || 0,
                moduleName: formData.moduleName,
                subModuleName: formData.subModuleName,
                groupIndex: formData.groupIndex || 1
            };

            if (editingModule) {
                await api.moduleMaster.update(editingModule.moduleId, payload);
            } else {
                await api.moduleMaster.create(payload);
            }

            await loadModules();
            setShowModal(false);
            setEditingModule(null);
            setFormData({ moduleName: '', subModuleName: '', groupIndex: 1 });
        } catch (err) {
            console.error('Error saving module:', err);
            alert('Failed to save module.');
        } finally {
            setSaving(false);
        }
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filtered = modules.filter(m =>
        m.moduleName.toLowerCase().includes(search.toLowerCase()) ||
        m.subModuleName.toLowerCase().includes(search.toLowerCase())
    );

    const sortedModules = React.useMemo(() => {
        let sortableItems = [...filtered];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof ModuleMaster];
                const bValue = b[sortConfig.key as keyof ModuleMaster];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filtered, sortConfig]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2"
            >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Dashboard</span>
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Modules</h1>
                    <p className="text-slate-500 dark:text-zinc-400 mt-1">Manage system modules and submodule definitions.</p>
                </div>
                {hasPermission('Module Master', 'Create') && (
                    <button
                        onClick={() => {
                            setEditingModule(null);
                            setFormData({ moduleName: '', subModuleName: '', groupIndex: 1 });
                            setShowModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
                    >
                        <Plus size={18} />
                        Add Module
                    </button>
                )}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search modules..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                                <th className="px-4 sm:px-6 py-4 font-semibold">Module Name</th>
                                <th className="px-4 sm:px-6 py-4 font-semibold">Sub Module</th>
                                <th
                                    className="px-4 sm:px-6 py-4 font-semibold cursor-pointer hover:text-blue-600 transition-colors select-none"
                                    onClick={() => handleSort('groupIndex')}
                                >
                                    <div className="flex items-center gap-1">
                                        Group Index
                                        {sortConfig.key === 'groupIndex' && (
                                            <span className="text-blue-600">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 sm:px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 sm:px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                            <span className="text-sm text-slate-500">Loading modules...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedModules.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 sm:px-6 py-12 text-center text-slate-500">
                                        No modules found.
                                    </td>
                                </tr>
                            ) : (
                                sortedModules.map((module) => (
                                    <tr key={module.moduleId} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 font-medium">{module.moduleName}</td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-600 dark:text-zinc-400">{module.subModuleName}</td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-600 dark:text-zinc-400">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded text-xs font-mono font-bold">
                                                {module.groupIndex}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {hasPermission('Module', 'Edit') && (
                                                    <button
                                                        onClick={() => handleEdit(module)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                )}
                                                {hasPermission('Module', 'Delete') && (
                                                    <button
                                                        onClick={() => handleDelete(module.moduleId)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Database size={20} />
                                </div>
                                <h2 className="text-xl font-bold">{editingModule ? 'Edit Module' : 'Add Module'}</h2>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Module Name</label>
                                <input
                                    type="text"
                                    value={formData.moduleName}
                                    onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Sales"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Sub Module Name</label>
                                <input
                                    type="text"
                                    value={formData.subModuleName}
                                    onChange={(e) => setFormData({ ...formData, subModuleName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Orders"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Group Index</label>
                                <input
                                    type="number"
                                    value={formData.groupIndex ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({
                                            ...formData,
                                            groupIndex: val === '' ? undefined : parseInt(val)
                                        });
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Order # (e.g. 1)"
                                    min="1"
                                />
                                <p className="text-xs text-slate-500 mt-1">Used for sorting grouping order.</p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                {editingModule && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!formData.moduleName || !formData.subModuleName) {
                                                alert('Module Name and Sub Module Name are required.');
                                                return;
                                            }

                                            setSaving(true);
                                            try {
                                                const payload: ModuleMaster = {
                                                    moduleId: 0, // Force new ID
                                                    moduleName: formData.moduleName,
                                                    subModuleName: formData.subModuleName,
                                                    groupIndex: formData.groupIndex || 1
                                                };

                                                await api.moduleMaster.create(payload);

                                                await loadModules();
                                                setShowModal(false);
                                                setEditingModule(null);
                                                setFormData({ moduleName: '', subModuleName: '', groupIndex: 1 });
                                            } catch (err) {
                                                console.error('Error saving module as new:', err);
                                                alert('Failed to save module as new.');
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        disabled={saving}
                                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Save As New
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingModule ? 'Update Module' : 'Create Module'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleMasterManager;
