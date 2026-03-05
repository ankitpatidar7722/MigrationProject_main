import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ManualConfiguration as ManualConfigType, ModuleMaster } from '../types';
import { Plus, Search, Loader2, ArrowLeft, Edit3, Trash2, Save, X } from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';
import { useRefresh } from '../services/RefreshContext';
import { useAuth } from '../services/AuthContext';

const ManualConfiguration: React.FC = () => {
    const { projectId: projectIdStr } = useParams<{ projectId: string }>();
    const projectId = projectIdStr ? parseInt(projectIdStr, 10) : 0;
    const { hasPermission } = useAuth();

    const [configs, setConfigs] = useState<ManualConfigType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [moduleMasters, setModuleMasters] = useState<ModuleMaster[]>([]);
    const [selectedModule, setSelectedModule] = useState<string>('');
    const [selectedSubModule, setSelectedSubModule] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [saving, setSaving] = useState(false);

    // Toggle Form State
    const [showForm, setShowForm] = useState(false);

    const { registerRefresh } = useRefresh();

    const loadData = async () => {
        if (!projectId) return;

        // Load Modules (Critical for Form)
        try {
            const modules = await api.moduleMaster.getAll();
            console.log('Modules loaded:', modules);
            setModuleMasters(modules || []);
        } catch (err) {
            console.error('Error loading modules:', err);
        }

        // Load Configs (Can fail without breaking form)
        try {
            const data = await api.manualConfigurations.getByProject(projectId);
            setConfigs(data || []);
        } catch (err) {
            console.error('Error loading configurations:', err);
            // If 404 (Endpoint not found), it means backend isn't updated yet.
            // We still allow the user to see the form, though Save will likely fail too.
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        registerRefresh(loadData);
        return () => registerRefresh(() => { });
    }, [projectId, registerRefresh]);

    // Derived State for Dropdowns
    const uniqueModules = Array.from(new Set(moduleMasters
        .map(m => {
            // Handle both camelCase and PascalCase
            const name = m.moduleName || (m as any).ModuleName;
            return name ? name.trim() : '';
        })
        .filter(Boolean)
    )).sort();

    const availableSubModules = moduleMasters
        .filter(m => {
            const name = m.moduleName || (m as any).ModuleName;
            return name?.trim() === selectedModule;
        })
        .map(m => {
            const subName = m.subModuleName || (m as any).SubModuleName;
            return subName ? subName.trim() : '';
        })
        .filter(Boolean)
        .sort();

    const handleEdit = (item: ManualConfigType) => {
        setEditingId(item.id);
        setSelectedModule(item.moduleName);
        setSelectedSubModule(item.subModuleName);
        setDescription(item.description);
        setShowForm(true); // Open form on edit
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setSelectedModule('');
        setSelectedSubModule('');
        setDescription('');
        setShowForm(false); // Close form on cancel
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !selectedModule || !selectedSubModule) return;

        setSaving(true);
        try {
            const payload: any = {
                projectId,
                moduleName: selectedModule,
                subModuleName: selectedSubModule,
                description
            };

            if (editingId) {
                payload.id = editingId;
                await api.manualConfigurations.update(editingId, payload);
            } else {
                await api.manualConfigurations.create(payload);
            }

            await loadData();
            handleCancel(); // This will also close the form
        } catch (err) {
            console.error('Error saving:', err);
            alert('Failed to save configuration.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await api.manualConfigurations.delete(id);
            await loadData();
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const filtered = configs.filter(c =>
        c.moduleName.toLowerCase().includes(search.toLowerCase()) ||
        c.subModuleName.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to={`/projects/${projectId}`} className="p-2 -ml-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Manual Configuration</h1>
                        <p className="text-slate-500 dark:text-zinc-400 mt-1">Log manual work and maintenance details.</p>
                    </div>
                </div>

                {!showForm && !editingId && hasPermission('Manual Configuration', 'Create') && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        New Configuration
                    </button>
                )}
            </div>

            {/* Form Section - Conditionally Rendered */}
            {(showForm || editingId) && (
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        {editingId ? <Edit3 size={18} className="text-blue-500" /> : <Plus size={18} className="text-emerald-500" />}
                        {editingId ? 'Update Configuration' : 'New Configuration Record'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Module</label>
                                <SearchableSelect
                                    value={selectedModule}
                                    onChange={(val) => {
                                        setSelectedModule(String(val));
                                        setSelectedSubModule(''); // Reset sub-module
                                    }}
                                    options={uniqueModules.map(m => ({ label: m, value: m }))}
                                    placeholder="Select Module"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Sub-Module</label>
                                <SearchableSelect
                                    value={selectedSubModule}
                                    onChange={(val) => setSelectedSubModule(String(val))}
                                    options={availableSubModules.map(s => ({ label: s, value: s }))}
                                    placeholder="Select Sub-Module"
                                    disabled={!selectedModule}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5">Description / Work Done</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                placeholder="Describe the manual configuration or maintenance work performed..."
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors flex items-center gap-2"
                            >
                                <X size={18} /> Cancel
                            </button>
                            {(editingId ? hasPermission('Manual Configuration', 'Edit') : hasPermission('Manual Configuration', 'Create')) && (
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`px-6 py-2.5 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2
                    ${editingId
                                            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                        } disabled:opacity-50`}
                                >
                                    <Save size={18} />
                                    {saving ? 'Saving...' : (editingId ? 'Update Record' : 'Save Record')}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Records ({filtered.length})</h2>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Module / Sub-Module</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.moduleName}</div>
                                            <div className="text-xs text-slate-500">{item.subModuleName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-zinc-300">
                                            <p className="line-clamp-2 max-w-xl">{item.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {hasPermission('Manual Configuration', 'Edit') && (
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                )}
                                                {hasPermission('Manual Configuration', 'Delete') && (
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                            No configuration records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualConfiguration;
