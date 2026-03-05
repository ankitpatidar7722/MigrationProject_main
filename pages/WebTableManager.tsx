import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { WebTable, ModuleMaster } from '../types';
import { Plus, Search, Trash2, Edit3, Loader2, X, Table, Monitor, LayoutGrid, ArrowLeft } from 'lucide-react';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const WebTableManager: React.FC = () => {
    const { hasPermission } = useAuth();
    const [tables, setTables] = useState<WebTable[]>([]);
    const [modules, setModules] = useState<ModuleMaster[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingTable, setEditingTable] = useState<WebTable | null>(null);

    // Scroll Sync Refs
    const topScrollRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [scrollWidth, setScrollWidth] = useState(0);

    // Form State
    const [formData, setFormData] = useState<Partial<WebTable>>({
        tableName: '',
        desktopTableName: '',
        moduleName: '',
        groupIndex: undefined,
        description: ''
    });

    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: 'tableName', direction: 'asc' });

    const fetchData = async () => {
        try {
            const [tablesData, modulesData] = await Promise.all([
                api.webTables.getAll(),
                api.moduleMaster.getAll()
            ]);
            setTables(tablesData);
            setModules(modulesData);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Sync scroll width
    useEffect(() => {
        const checkScrollWidth = () => {
            if (tableContainerRef.current) {
                setScrollWidth(tableContainerRef.current.scrollWidth);
            }
        };

        // Check initially and whenever items change/filter changes
        checkScrollWidth();
        // Also use ResizeObserver for robustness
        const observer = new ResizeObserver(checkScrollWidth);
        if (tableContainerRef.current) {
            observer.observe(tableContainerRef.current);
        }
        return () => observer.disconnect();
    }, [tables, loading]);

    const handleScroll = (source: 'top' | 'table') => {
        const top = topScrollRef.current;
        const table = tableContainerRef.current;
        if (!top || !table) return;

        if (source === 'top') {
            table.scrollLeft = top.scrollLeft;
        } else {
            top.scrollLeft = table.scrollLeft;
        }
    };

    const handleModuleChange = (moduleName: string) => {
        const selectedModule = modules.find(m => m.moduleName === moduleName);
        setFormData(prev => ({
            ...prev,
            moduleName,
            groupIndex: selectedModule?.groupIndex
        }));
    };

    const handleEdit = (table: WebTable) => {
        setEditingTable(table);
        setFormData({
            tableName: table.tableName,
            desktopTableName: table.desktopTableName,
            moduleName: table.moduleName,
            groupIndex: table.groupIndex,
            description: table.description
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this table definition?')) {
            try {
                await api.webTables.delete(id);
                const data = await api.webTables.getAll();
                setTables(data);
            } catch (err) {
                console.error('Error deleting table:', err);
                alert('Failed to delete table.');
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.tableName || !formData.moduleName) {
            alert('Web Table Name and Module Name are required.');
            return;
        }

        setSaving(true);
        try {
            const payload: WebTable = {
                webTableId: editingTable?.webTableId || 0,
                tableName: formData.tableName || '',
                desktopTableName: formData.desktopTableName,
                moduleName: formData.moduleName,
                groupIndex: formData.groupIndex,
                description: formData.description
            };

            if (editingTable) {
                await api.webTables.update(editingTable.webTableId, payload);
            } else {
                await api.webTables.create(payload);
            }

            const data = await api.webTables.getAll();
            setTables(data);
            setShowModal(false);
            setEditingTable(null);
            setFormData({ tableName: '', desktopTableName: '', moduleName: '', groupIndex: undefined, description: '' });
        } catch (err) {
            console.error('Error saving table:', err);
            alert('Failed to save table.');
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

    const filtered = tables.filter(t =>
        t.tableName.toLowerCase().includes(search.toLowerCase()) ||
        (t.desktopTableName || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.moduleName || '').toLowerCase().includes(search.toLowerCase())
    );

    const sortedTables = React.useMemo(() => {
        let sortableItems = [...filtered];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof WebTable];
                const bValue = b[sortConfig.key as keyof WebTable];

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

    // Unique modules for dropdown
    const uniqueModules = Array.from(new Set(modules.map(m => m.moduleName)))
        .map(name => modules.find(m => m.moduleName === name))
        .filter((m): m is ModuleMaster => m !== undefined)
        .sort((a, b) => (a.moduleName || '').localeCompare(b.moduleName || ''));



    if (loading) {
        return <LoadingOverlay isVisible={true} message="Loading Tables..." />;
    }

    return (
        <div className="space-y-6 w-full max-w-[95%] mx-auto">
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2"
            >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Dashboard</span>
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Web Tables</h1>
                    <p className="text-slate-500 dark:text-zinc-400 mt-1">Manage standard web application tables.</p>
                </div>
                {hasPermission('Tables', 'Create') && (
                    <button
                        onClick={() => {
                            setEditingTable(null);
                            setFormData({ tableName: '', desktopTableName: '', moduleName: '', groupIndex: undefined, description: '' });
                            setShowModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
                    >
                        <Plus size={18} />
                        Add Table
                    </button>
                )}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search tables..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                {/* Top Scrollbar */}
                <div
                    ref={topScrollRef}
                    className="overflow-x-auto border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900"
                    onScroll={() => handleScroll('top')}
                    style={{ minHeight: '12px' }}
                >
                    <div style={{ width: scrollWidth, height: '1px' }}></div>
                </div>

                {/* Table Container */}
                <div
                    ref={tableContainerRef}
                    className="overflow-x-auto"
                    onScroll={() => handleScroll('table')}
                >
                    <table className="w-full text-left border-collapse" style={{ minWidth: 'max-content' }}>
                        <thead>
                            <tr className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold cursor-pointer" onClick={() => handleSort('moduleName')}>
                                    <div className="flex items-center gap-1">
                                        Module Name
                                        {sortConfig.key === 'moduleName' && <span className="text-blue-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold cursor-pointer" onClick={() => handleSort('tableName')}>
                                    <div className="flex items-center gap-1">
                                        Web Table
                                        {sortConfig.key === 'tableName' && <span className="text-blue-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold cursor-pointer" onClick={() => handleSort('desktopTableName')}>
                                    <div className="flex items-center gap-1">
                                        Desktop Table
                                        {sortConfig.key === 'desktopTableName' && <span className="text-blue-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold cursor-pointer" onClick={() => handleSort('groupIndex')}>
                                    <div className="flex items-center gap-1">
                                        Group Index
                                        {sortConfig.key === 'groupIndex' && <span className="text-blue-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold">Description</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                            <span className="text-sm text-slate-500">Loading tables...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedTables.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No tables found.
                                    </td>
                                </tr>
                            ) : (
                                sortedTables.map((table) => (
                                    <tr key={table.webTableId} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{table.moduleName || '-'}</td>
                                        <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400">{table.tableName}</td>
                                        <td className="px-6 py-4 font-mono text-slate-600 dark:text-zinc-400">{table.desktopTableName || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded text-xs font-mono font-bold">
                                                {table.groupIndex || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-zinc-400 truncate max-w-[200px]" title={table.description}>
                                            {table.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {hasPermission('Tables', 'Edit') && (
                                                    <button
                                                        onClick={() => handleEdit(table)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                )}
                                                {hasPermission('Tables', 'Delete') && (
                                                    <button
                                                        onClick={() => handleDelete(table.webTableId)}
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
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Table size={20} />
                                </div>
                                <h2 className="text-xl font-bold">{editingTable ? 'Edit Table' : 'Add Table'}</h2>
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
                                <div className="relative">
                                    <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        value={formData.moduleName}
                                        onChange={(e) => handleModuleChange(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                        required
                                    >
                                        <option value="" disabled hidden>Select Module</option>
                                        {uniqueModules.map(m => (
                                            <option key={m.moduleId} value={m.moduleName}>{m.moduleName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Web Table Name</label>
                                    <div className="relative">
                                        <Table className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData.tableName}
                                            onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                            placeholder="e.g. users"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Desktop Table Name</label>
                                    <div className="relative">
                                        <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData.desktopTableName || ''}
                                            onChange={(e) => setFormData({ ...formData, desktopTableName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                            placeholder="e.g. TBL_USERS"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Group Index (Auto-filled)</label>
                                <input
                                    type="number"
                                    value={formData.groupIndex || ''}
                                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-zinc-800/50 border-none rounded-xl outline-none font-mono text-slate-500 cursor-not-allowed"
                                    placeholder="Select a module to see group index"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                                    placeholder="Brief description..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingTable ? 'Update Table' : 'Create Table'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebTableManager;
