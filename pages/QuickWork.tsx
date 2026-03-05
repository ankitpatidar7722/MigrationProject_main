import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { QuickWork, ModuleMaster, WebTable } from '../types';
import {
    Plus, Search, Edit3, Trash2, Copy, Save, X, FileText, Database, Code
} from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useRefresh } from '../services/RefreshContext';

const QuickWorkPage: React.FC = () => {
    const [quickWorks, setQuickWorks] = useState<QuickWork[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    // Dropdown Data
    const [moduleMasters, setModuleMasters] = useState<ModuleMaster[]>([]);
    const [webTables, setWebTables] = useState<WebTable[]>([]);

    // Form Fields
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedSubModule, setSelectedSubModule] = useState('');
    const [tableName, setTableName] = useState('');
    const [description, setDescription] = useState('');
    const [sqlQuery, setSqlQuery] = useState('');

    const { registerRefresh } = useRefresh();

    const loadData = async () => {
        try {
            const [works, modules, tables] = await Promise.all([
                api.quickWorks.getAll(),
                api.moduleMaster.getAll(),
                api.webTables.getAll()
            ]);
            setQuickWorks(works || []);
            setModuleMasters(modules || []);
            setWebTables(tables || []);
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

    // Derived Dropdown Options
    const uniqueModules = Array.from(new Set(moduleMasters
        .map(m => m.moduleName?.trim())
        .filter(Boolean)
    )).sort();

    const availableSubModules = moduleMasters
        .filter(m => m.moduleName?.trim() === selectedModule)
        .map(m => m.subModuleName?.trim())
        .filter(Boolean)
        .sort();

    const availableTables = webTables
        .filter(t => t.moduleName === selectedModule)
        .map(t => ({ value: t.tableName, label: t.tableName }))
        .sort((a, b) => a.label.localeCompare(b.label));


    const handleEdit = (item: QuickWork) => {
        setEditingId(item.id);
        setSelectedModule(item.moduleName || '');
        setSelectedSubModule(item.subModuleName || '');
        setTableName(item.tableName || '');
        setDescription(item.description || '');
        setSqlQuery(item.sqlQuery || '');
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            await api.quickWorks.delete(id);
            loadData();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could show a toast here
        alert('SQL copied to clipboard!');
    };

    const handleSave = async (isSaveAs: boolean = false) => {
        if (!selectedModule || !description || !sqlQuery) {
            alert('Please fill required fields (Module, Description, SQL Query)');
            return;
        }

        setSaving(true);
        try {
            const payload: Partial<QuickWork> = {
                moduleName: selectedModule,
                subModuleName: selectedSubModule,
                tableName: tableName,
                description: description,
                sqlQuery: sqlQuery
            };

            if (editingId && !isSaveAs) {
                await api.quickWorks.update(editingId, payload);
            } else {
                await api.quickWorks.create(payload);
            }

            await loadData();
            setShowModal(false);
            resetForm();
        } catch (err) {
            console.error('Error saving:', err);
            alert('Failed to save record');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setSelectedModule('');
        setSelectedSubModule('');
        setTableName('');
        setDescription('');
        setSqlQuery('');
    };

    const filteredItems = quickWorks.filter(item =>
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.moduleName?.toLowerCase().includes(search.toLowerCase()) ||
        item.tableName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Work / SQL Library</h1>
                    <p className="text-slate-500 dark:text-zinc-400">Manage and reuse useful SQL snippets and configurations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 w-64 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Work</span>
                    </button>
                </div>
            </div>

            <LoadingOverlay isVisible={loading} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        {item.moduleName}
                                    </span>
                                    {item.subModuleName && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                                            {item.subModuleName}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">

                                    {/* Actually actions required: Edit, Delete, Copy SQL */}
                                    <button
                                        onClick={() => copyToClipboard(item.sqlQuery)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Copy SQL"
                                    >
                                        <Code className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{item.description}</h3>
                            {item.tableName && (
                                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                                    <Database className="w-3 h-3" /> {item.tableName}
                                </p>
                            )}

                            <div className="bg-slate-50 dark:bg-zinc-950 rounded-lg p-3 border border-slate-100 dark:border-zinc-800 relative group">
                                <code className="text-xs text-slate-600 dark:text-zinc-400 font-mono line-clamp-3 block">
                                    {item.sqlQuery}
                                </code>
                                {/* Quick copy overlay */}
                                <button
                                    onClick={() => copyToClipboard(item.sqlQuery)}
                                    className="absolute top-2 right-2 p-1 bg-white dark:bg-zinc-800 shadow-sm rounded border border-slate-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Copy className="w-3 h-3 text-slate-500" />
                                </button>
                            </div>
                        </div>

                        <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 text-xs text-slate-500 flex justify-between">
                            <span>Updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* CREATE / EDIT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingId ? 'Edit Work' : 'Create New Work'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <SearchableSelect
                                    label="Module"
                                    value={selectedModule}
                                    onChange={setSelectedModule}
                                    options={uniqueModules.map(m => ({ value: m, label: m }))}
                                    placeholder="Select Module"
                                />

                                <SearchableSelect
                                    label="Sub Module"
                                    value={selectedSubModule}
                                    onChange={setSelectedSubModule}
                                    options={availableSubModules.map(m => ({ value: m, label: m }))}
                                    placeholder="Select Sub Module"
                                />
                            </div>

                            <div>
                                <SearchableSelect
                                    label="Table Name"
                                    value={tableName}
                                    onChange={setTableName}
                                    options={availableTables}
                                    placeholder={selectedModule ? "Select Table" : "Select Module First"}
                                    disabled={!selectedModule}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Brief description of usage"
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                                    SQL Query <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={sqlQuery}
                                    onChange={e => setSqlQuery(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 font-mono text-sm focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                                    placeholder="SELECT * FROM ..."
                                />
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(sqlQuery)}
                                    className="absolute top-8 right-3 p-1.5 bg-white dark:bg-zinc-800 shadow-sm rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-500 hover:text-blue-600 transition-colors"
                                    title="Copy to Clipboard"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-zinc-900">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>

                            {editingId ? (
                                <>
                                    <button
                                        onClick={() => handleSave(true)}
                                        disabled={saving}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving ? 'Saving...' : 'Save As New'}
                                    </button>
                                    <button
                                        onClick={() => handleSave(false)}
                                        disabled={saving}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving ? 'Updating...' : 'Update Record'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : 'Save Work'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickWorkPage;
