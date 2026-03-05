import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ServerData, DatabaseDetail } from '../types';
import { Plus, Search, Server, Database, Trash2, Edit3, X, Loader2, Save } from 'lucide-react';
import { useRefresh } from '../services/RefreshContext';
import { useAuth } from '../services/AuthContext';

const DatabaseManager: React.FC = () => {
    const [databases, setDatabases] = useState<DatabaseDetail[]>([]);
    const [servers, setServers] = useState<ServerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<DatabaseDetail>>({
        clientName: '',
        databaseName: '',
        serverId: 0,
        serverIndex: ''
    });



    const { hasPermission } = useAuth();
    const { registerRefresh } = useRefresh();

    const loadData = async () => {
        try {
            const [dbData, serverData] = await Promise.all([
                api.databaseDetails.getAll(),
                api.serverData.getAll()
            ]);
            setDatabases(dbData);
            setServers(serverData);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        registerRefresh(loadData);
        return () => registerRefresh(() => { });
    }, [registerRefresh]);

    const handleServerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const serverId = parseInt(e.target.value);
        const selectedServer = servers.find(s => s.serverId === serverId);

        setFormData(prev => ({
            ...prev,
            serverId: serverId,
            // Auto-fill ServerIndex Logic
            serverIndex: selectedServer ? selectedServer.serverIndex : ''
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientName || !formData.databaseName || !formData.serverId) {
            alert('Please fill all required fields');
            return;
        }

        setSaving(true);
        try {
            const payload: DatabaseDetail = {
                databaseId: formData.databaseId || 0,
                clientName: formData.clientName,
                databaseName: formData.databaseName,
                serverId: formData.serverId,
                serverIndex: formData.serverIndex || '',
                databaseCategory: formData.databaseCategory
            };

            if (formData.databaseId) {
                await api.databaseDetails.update(formData.databaseId, payload);
            } else {
                await api.databaseDetails.create(payload);
            }

            await loadData();
            setShowModal(false);
            resetForm();
        } catch (err) {
            console.error('Error saving database:', err);
            alert('Failed to save database details');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this database entry?')) {
            try {
                await api.databaseDetails.delete(id);
                await loadData();
            } catch (err) {
                console.error('Error deleting:', err);
                alert('Failed to delete');
            }
        }
    };

    const handleEdit = (item: DatabaseDetail) => {
        setFormData(item);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            clientName: '',
            databaseName: '',
            serverId: 0,
            serverIndex: '',
            databaseCategory: ''
        });
    };

    // ...

    const [filter, setFilter] = useState<'All' | 'Desktop' | 'Web' | 'Office'>('All');

    // ... (existing code)

    const filtered = databases.filter(d => {
        const matchesSearch =
            d.clientName.toLowerCase().includes(search.toLowerCase()) ||
            d.databaseName.toLowerCase().includes(search.toLowerCase());

        const category = d.databaseCategory?.toUpperCase() || '';

        let matchesFilter = true;
        if (filter === 'Desktop') matchesFilter = category === 'DT';
        if (filter === 'Web') matchesFilter = category === 'WT';
        if (filter === 'Office') matchesFilter = category === 'OFFICE';

        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Database Management</h1>
                    <p className="text-slate-500 dark:text-zinc-400 mt-1">Manage database details and server mappings.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg">
                        {(['All', 'Desktop', 'Web', 'Office'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === f
                                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    {hasPermission('Database', 'Create') && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm"
                        >
                            <Plus size={18} />
                            Add Database
                        </button>
                    )}
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search databases..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(db => (
                    <div key={db.databaseId} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{db.databaseName}</h3>
                                    <p className="text-xs text-slate-500">{db.clientName}</p>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {hasPermission('Database', 'Edit') && (
                                    <button onClick={() => handleEdit(db)} className="p-2 text-slate-400 hover:text-blue-500 rounded-lg icon-btn">
                                        <Edit3 size={16} />
                                    </button>
                                )}
                                {hasPermission('Database', 'Delete') && (
                                    <button onClick={() => handleDelete(db.databaseId)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg icon-btn">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800/50">
                                <span className="text-slate-500">Server</span>
                                <span className="font-medium flex items-center gap-1.5">
                                    <Server size={14} className="text-slate-400" />
                                    {db.server?.serverName || 'Unknown'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-500">Server Index</span>
                                <span className="font-mono bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs">
                                    {db.serverIndex}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold">{formData.databaseId ? 'Edit Database' : 'Add Database'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4">
                                {/* Server Selection */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Server</label>
                                    <select
                                        value={formData.serverId}
                                        onChange={handleServerChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value={0} disabled hidden>Select Server</option>

                                        {servers.map(s => (
                                            <option key={s.serverId} value={s.serverId}>{s.serverName} ({s.hostName})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Server Index (Auto-filled) */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Server Index [1]</label>
                                    <input
                                        type="text"
                                        value={formData.serverIndex}
                                        readOnly
                                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-zinc-800/50 text-slate-500 border-none rounded-xl outline-none cursor-not-allowed font-mono"
                                        placeholder="Auto-populated from Server"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Auto-populated based on selected Server</p>
                                </div>

                                {/* Client Name */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Client Name</label>
                                    <input
                                        type="text"
                                        value={formData.clientName}
                                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Acme Corp"
                                        required
                                    />
                                </div>

                                {/* Database Name */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Database Name</label>
                                    <input
                                        type="text"
                                        value={formData.databaseName}
                                        onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. DB_Acme_2024"
                                        required
                                    />
                                </div>

                                {/* Database Category */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Category</label>
                                    <select
                                        value={
                                            formData.databaseCategory === 'DT' ? 'Desktop' :
                                                formData.databaseCategory === 'WT' ? 'Web' :
                                                    formData.databaseCategory === 'OFFICE' ? 'Office' : ''
                                        }
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            let dbVal = '';
                                            if (val === 'Desktop') dbVal = 'DT';
                                            if (val === 'Web') dbVal = 'WT';
                                            if (val === 'Office') dbVal = 'OFFICE';
                                            setFormData({ ...formData, databaseCategory: dbVal });
                                        }}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="" disabled hidden>Select Category</option>

                                        <option value="Desktop">Desktop</option>
                                        <option value="Web">Web</option>
                                        <option value="Office">Office</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-zinc-800/50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 dark:text-zinc-400 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                {(formData.databaseId ? hasPermission('Database', 'Edit') : hasPermission('Database', 'Create')) && (
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Save Database
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatabaseManager;
