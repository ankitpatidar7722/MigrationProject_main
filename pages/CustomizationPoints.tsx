
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CustomizationPoint, CustomizationType, CustomizationStatus, ModuleMaster } from '../types';
import { Plus, Search, Filter, Trash2, Edit3, Loader2, DollarSign, StickyNote, Tag, ArrowLeft } from 'lucide-react';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useRefresh } from '../services/RefreshContext';
import { useAuth } from '../services/AuthContext';

const CustomizationPoints: React.FC = () => {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = projectIdStr ? parseInt(projectIdStr, 10) : 0;
  const { hasPermission } = useAuth();

  const [items, setItems] = useState<CustomizationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomizationPoint | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });

  // Module Master State
  const [moduleMasters, setModuleMasters] = useState<ModuleMaster[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');

  const { registerRefresh } = useRefresh();

  const loadItems = async () => {
    if (!projectId) return;
    try {
      const [customizations, modules] = await Promise.all([
        api.customization.getByProject(projectId),
        api.moduleMaster.getAll()
      ]);
      setItems(customizations);
      setModuleMasters(modules);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    registerRefresh(loadItems);
    return () => registerRefresh(() => { });
  }, [projectId, registerRefresh]);

  useEffect(() => {
    if (editingItem) {
      setSelectedModule(editingItem.moduleName);
    } else {
      setSelectedModule('');
    }
  }, [editingItem]);

  const uniqueModules = Array.from(new Set(moduleMasters.map(m => m.moduleName)));
  const availableSubModules = moduleMasters
    .filter(m => m.moduleName === selectedModule)
    .map(m => m.subModuleName);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const count = items.length + 1;
      const itemData: CustomizationPoint = {
        customizationId: editingItem?.customizationId || 0, // Backend handles generation
        requirementId: editingItem?.requirementId || `REQ-${count.toString().padStart(3, '0')}`,
        projectId: projectId,
        moduleName: formData.get('moduleName') as string,
        subModuleName: formData.get('subModuleName') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        type: formData.get('type') as CustomizationType,
        status: formData.get('status') as CustomizationStatus,
        isBillable: formData.get('isBillable') === 'on',
        notes: formData.get('notes') as string
      };

      if (editingItem) {
        await api.customization.update(itemData.customizationId, itemData);
      } else {
        await api.customization.create(itemData);
      }

      await loadItems();
      setShowModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving customization:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAs = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const button = e.currentTarget;
      const form = button.closest('form');
      if (!form) throw new Error('Form not found');

      const formData = new FormData(form);

      // const count = items.length + 1; // Unused
      const newItem: CustomizationPoint = {
        customizationId: 0, // Let backend generate
        requirementId: `REQ-${Date.now().toString().slice(-6)}`,
        projectId: projectId,
        moduleName: formData.get('moduleName') as string,
        subModuleName: formData.get('subModuleName') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        type: formData.get('type') as CustomizationType,
        status: formData.get('status') as CustomizationStatus,
        isBillable: formData.get('isBillable') === 'on',
        notes: formData.get('notes') as string
      };

      await api.customization.create(newItem);
      await loadItems();
      setShowModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving as new customization:', err);
      alert('Failed to save as new record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.customization.delete(deleteConfirm.id);
      await loadItems();
      setDeleteConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Error deleting customization:', err);
    }
  };

  const getTypeColor = (type: CustomizationType) => {
    switch (type) {
      case 'UI': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Report': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Database': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Workflow': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const filtered = items.filter(i =>
    (i.title?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase())) ||
    i.moduleName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading Customization Points..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="p-2 -ml-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Customization Points</h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">Record client-specific post-migration enhancements.</p>
          </div>
        </div>
        {hasPermission('Customization Points', 'Create') && (
          <button
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium shadow-sm transition-all"
          >
            <Plus size={18} />
            Record Requirement
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Filter requirements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none shadow-sm focus:ring-2 focus:ring-amber-500/20 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(item => (
          <div key={item.customizationId} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-tighter">
                  {item.requirementId}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getTypeColor(item.type)}`}>
                  {item.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.isBillable && (
                  <div className="p-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-full" title="Billable">
                    <DollarSign size={14} />
                  </div>
                )}
                {hasPermission('Customization Points', 'Edit') && (
                  <button onClick={() => {
                    setEditingItem(item);
                    setSelectedModule(item.moduleName);
                    setShowModal(true);
                  }} className="p-1 text-slate-400 hover:text-amber-600 transition-colors" title="Edit">
                    <Edit3 size={16} />
                  </button>
                )}
                {hasPermission('Customization Points', 'Delete') && (
                  <button
                    onClick={() => handleDelete(item.customizationId)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <h3 className="font-bold text-lg mb-1">{item.title}</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mb-2">{item.description}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">{item.moduleName} &bull; {item.subModuleName}</p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400 mb-1">
                  <StickyNote size={12} />
                  Internal Notes
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 italic">
                  {item.notes || 'No additional notes provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.status === 'Completed' ? 'bg-emerald-500' :
                    item.status === 'In Progress' ? 'bg-blue-500' :
                      item.status === 'Dropped' ? 'bg-red-500' : 'bg-slate-300'
                    }`} />
                  <span className="text-xs font-bold text-slate-500 uppercase">{item.status}</span>
                </div>
                <button className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  History
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl border-dashed">
            <Tag size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold">No customization points</h3>
            <p className="text-slate-500 dark:text-zinc-400">Record any specific requests for this client here.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Requirement' : 'New Customization Requirement'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Module</label>
                  <select
                    name="moduleName"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="" disabled hidden>Select Module</option>
                    {uniqueModules.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Sub Module</label>
                  <select
                    name="subModuleName"
                    defaultValue={editingItem?.subModuleName}
                    required
                    disabled={!selectedModule}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50"
                  >
                    <option value="" disabled hidden>Select Sub-Module</option>
                    {availableSubModules.map(sm => (
                      <option key={sm} value={sm}>{sm}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Title</label>
                <input name="title" defaultValue={editingItem?.title} required className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Short summary" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description</label>
                <textarea name="description" defaultValue={editingItem?.description} className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Type</label>
                  <select name="type" defaultValue={editingItem?.type || 'UI'} className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="UI">UI Layout</option>
                    <option value="Report">Reporting</option>
                    <option value="Database">Database Logic</option>
                    <option value="Workflow">Workflow Change</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Status</label>
                  <select name="status" defaultValue={editingItem?.status || 'Not Started'} className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" name="isBillable" id="isBillable" defaultChecked={editingItem?.isBillable} className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                <label htmlFor="isBillable" className="text-sm font-medium select-none cursor-pointer">This is a billable customization</label>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Additional Notes</label>
                <textarea name="notes" defaultValue={editingItem?.notes} className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none min-h-[60px]" placeholder="Special client instructions..." />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 rounded-xl font-bold">Cancel</button>
                {editingItem && hasPermission('Customization Points', 'Create') && (
                  <button type="button" onClick={handleSaveAs} disabled={saving} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save As New'}
                  </button>
                )}
                {(editingItem ? hasPermission('Customization Points', 'Edit') : hasPermission('Customization Points', 'Create')) && (
                  <button type="submit" disabled={saving} className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : (editingItem ? 'Update Point' : 'Save Point')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Requirement</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-zinc-300 mb-6 text-sm">
                Are you sure you want to delete this customization point? It will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: null })}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const XIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

export default CustomizationPoints;
