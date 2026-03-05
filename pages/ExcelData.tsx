
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ExcelData, ModuleMaster } from '../types';
import {
    FileSpreadsheet,
    Plus,
    Search,
    ArrowLeft,
    Download,
    Trash2,
    FileText,
    X,
    Loader2,
    AlertCircle,
    Upload,
    Edit2
} from 'lucide-react';
import { useRefresh } from '../services/RefreshContext';
import { SearchableSelect } from '../components/SearchableSelect';
import { useAuth } from '../services/AuthContext';

const ExcelDataPage: React.FC = () => {
    const { projectId: projectIdStr } = useParams<{ projectId: string }>();
    const projectId = projectIdStr ? parseInt(projectIdStr, 10) : 0;
    const { registerRefresh } = useRefresh();
    const { hasPermission } = useAuth();

    const [excelDataList, setExcelDataList] = useState<ExcelData[]>([]);
    const [moduleMasters, setModuleMasters] = useState<ModuleMaster[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedSubModule, setSelectedSubModule] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const loadData = async () => {
        if (!projectId) return;

        try {
            // Load Modules (Critical for Form)
            try {
                const modules = await api.moduleMaster.getAll();
                setModuleMasters(modules || []);
            } catch (err) {
                console.error('Error loading modules:', err);
            }

            // Load Excel Data
            try {
                const data = await api.excelData.getByProject(projectId);
                setExcelDataList(data || []);
            } catch (err) {
                console.error('Error loading excel data:', err);
            }
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
            const name = m.moduleName || (m as any).ModuleName; // Handle case sensitivity
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

    const handleSave = async () => {
        if (!projectId || !selectedModule || !selectedSubModule) {
            alert('Please fill in all required module details.');
            return;
        }

        if (!editingId && !selectedFile) {
            alert('Please select a file to upload.');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('ProjectId', projectId.toString());
            formData.append('ModuleName', selectedModule);
            formData.append('SubModuleName', selectedSubModule);
            formData.append('Description', description);

            if (selectedFile) {
                formData.append('File', selectedFile);
            }

            if (editingId) {
                await api.excelData.update(editingId, formData);
            } else {
                await api.excelData.upload(formData);
            }

            await loadData();

            setShowForm(false);
            resetForm();

        } catch (err) {
            console.error('Failed to save record:', err);
            alert('Failed to save record. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setSelectedModule('');
        setSelectedSubModule('');
        setDescription('');
        setSelectedFile(null);
    }

    const handleEdit = (item: ExcelData) => {
        setEditingId(item.id);
        setSelectedModule(item.moduleName);
        setSelectedSubModule(item.subModuleName);
        setDescription(item.description || '');
        setSelectedFile(null); // Reset file, user must select new one if they want to replace
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this file?')) {
            try {
                await api.excelData.delete(id);
                setExcelDataList(prev => prev.filter(item => item.id !== id));
            } catch (err) {
                console.error('Failed to delete record:', err);
                alert('Failed to delete record.');
            }
        }
    };

    const handleDownload = async (id: number, fileName: string) => {
        try {
            const blob = await api.excelData.download(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download file.');
        }
    };

    const filteredList = excelDataList.filter(item =>
        item.moduleName.toLowerCase().includes(search.toLowerCase()) ||
        item.subModuleName.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.fileName.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <Link to={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-2 transition-colors">
                        <ArrowLeft size={18} />
                        Back to Project
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                            <FileSpreadsheet size={32} />
                        </div>
                        Excel Data
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-400 mt-1 ml-14">
                        Manage Excel files for migration modules.
                    </p>
                </div>

                {hasPermission('Excel Data', 'Create') && (
                    <button
                        onClick={() => { setShowForm(true); resetForm(); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        Upload New
                    </button>
                )}
            </div>

            {/* Upload Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Excel Data' : 'Upload Excel Data'}</h2>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Module <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={uniqueModules.map(m => ({ label: m, value: m }))}
                                    value={selectedModule}
                                    onChange={(val) => {
                                        setSelectedModule(val);
                                        setSelectedSubModule('');
                                    }}
                                    placeholder="Select Module"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Sub-Module <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={availableSubModules.map(m => ({ label: m, value: m }))}
                                    value={selectedSubModule}
                                    onChange={setSelectedSubModule}
                                    disabled={!selectedModule}
                                    placeholder="Select Sub-Module"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                                    placeholder="Describe the file content..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1.5">
                                    Excel File {editingId ? <span className="text-slate-400 font-normal">(Optional - Leave empty to keep existing)</span> : <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50 dark:bg-zinc-800/50">
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setSelectedFile(e.target.files[0]);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                                        <Upload className="text-slate-400" size={24} />
                                        {selectedFile ? (
                                            <span className="text-sm font-medium text-blue-600 truncate max-w-full px-4">
                                                {selectedFile.name}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-slate-500">Click to upload or drag and drop</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-zinc-800/50 flex justify-end gap-3">
                            <button
                                onClick={() => { setShowForm(false); resetForm(); }}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                            >
                                Cancel
                            </button>
                            {(editingId ? hasPermission('Excel Data', 'Edit') : hasPermission('Excel Data', 'Create')) && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingId ? 'Save Changes' : 'Upload'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* List View */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-zinc-800/50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="p-4">Module Details</th>
                                <th className="p-4">File Name</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Uploaded At</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                                        <AlertCircle size={24} className="opacity-50" />
                                        <span>No files found</span>
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900 dark:text-white">{item.moduleName}</div>
                                            <div className="text-xs text-slate-500">{item.subModuleName}</div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                                            <FileSpreadsheet size={16} className="text-green-600" />
                                            {item.fileName}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-zinc-400 max-w-xs truncate" title={item.description}>
                                            {item.description || '-'}
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {new Date(item.uploadedAt).toLocaleDateString()} {new Date(item.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {hasPermission('Excel Data', 'Edit') && (
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownload(item.id, item.fileName)}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                {hasPermission('Excel Data', 'Delete') && (
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExcelDataPage;
