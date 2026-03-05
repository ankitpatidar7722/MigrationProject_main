
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { MigrationIssue, IssueStatus, ModuleMaster } from '../types';
import { Plus, Search, Filter, AlertCircle, Clock, CheckCircle, XCircle, MoreVertical, Loader2, ArrowLeft, Edit3, Trash2 } from 'lucide-react';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useRefresh } from '../services/RefreshContext';
import { useAuth } from '../services/AuthContext';
import { SearchableSelect } from '../components/SearchableSelect';

const MigrationIssues: React.FC = () => {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = projectIdStr ? parseInt(projectIdStr, 10) : 0;
  const { hasPermission } = useAuth();

  const [issues, setIssues] = useState<MigrationIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIssue, setEditingIssue] = useState<MigrationIssue | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });

  // Module Master State
  const [moduleMasters, setModuleMasters] = useState<ModuleMaster[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedSubModule, setSelectedSubModule] = useState<string>('');
  const [priority, setPriority] = useState<string>('Medium');
  const [status, setStatus] = useState<IssueStatus>('Open');

  const { registerRefresh } = useRefresh();

  const loadIssues = async () => {
    if (!projectId) return;
    try {
      const [issuesData, modules] = await Promise.all([
        api.issues.getByProject(projectId),
        api.moduleMaster.getAll()
      ]);
      setIssues(issuesData);
      setModuleMasters(modules);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
    registerRefresh(loadIssues);
    return () => registerRefresh(() => { });
  }, [projectId, registerRefresh]);

  useEffect(() => {
    if (editingIssue) {
      setSelectedModule(editingIssue.moduleName);
      setSelectedSubModule(editingIssue.subModuleName);
      setPriority(editingIssue.priority);
      setStatus(editingIssue.status);
    } else {
      setSelectedModule('');
      setSelectedSubModule('');
      setPriority('Medium');
      setStatus('Open');
    }
  }, [editingIssue]);

  const uniqueModules = Array.from(new Set(moduleMasters.map(m => m.moduleName.trim())));
  const availableSubModules = moduleMasters
    .filter(m => m.moduleName.trim() === selectedModule)
    .map(m => m.subModuleName.trim());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const count = issues.length + 1;
      // Use timestamp component to avoid collisions
      const uniqueSuffix = Date.now().toString().slice(-6);
      const generatedId = editingIssue?.issueId || `ISS-${projectId}-${uniqueSuffix}`;
      const issueData: MigrationIssue = {
        issueId: generatedId,
        issueNumber: editingIssue?.issueNumber || generatedId,
        projectId: projectId,
        title: formData.get('title') as string,
        moduleName: formData.get('moduleName') as string,
        subModuleName: formData.get('subModuleName') as string,
        description: formData.get('description') as string,
        rootCause: formData.get('rootCause') as string,
        status: formData.get('status') as IssueStatus,
        remarks: formData.get('remarks') as string,
        reportedDate: editingIssue?.reportedDate || new Date().toISOString(),
        resolvedDate: formData.get('status') === 'Closed' ? new Date().toISOString() : undefined,
        priority: formData.get('priority') as any
      };

      if (editingIssue) {
        await api.issues.update(issueData.issueId, issueData);
      } else {
        await api.issues.create(issueData);
      }

      await loadIssues();
      setShowModal(false);
      setEditingIssue(null);
    } catch (err) {
      console.error('Error saving issue:', err);
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

      // const count = issues.length + 1; // Unused
      const uniqueSuffix = Date.now().toString().slice(-6);
      const generatedId = `ISS-${projectId}-${uniqueSuffix}`;
      const newIssue: MigrationIssue = {
        issueId: generatedId,
        issueNumber: generatedId,
        projectId: projectId,
        title: formData.get('title') as string,
        moduleName: formData.get('moduleName') as string,
        subModuleName: formData.get('subModuleName') as string,
        description: formData.get('description') as string,
        rootCause: formData.get('rootCause') as string,
        status: formData.get('status') as IssueStatus,
        remarks: formData.get('remarks') as string,
        reportedDate: new Date().toISOString(),
        resolvedDate: formData.get('status') === 'Closed' ? new Date().toISOString() : undefined,
        priority: formData.get('priority') as any
      };

      await api.issues.create(newIssue);
      await loadIssues();
      setShowModal(false);
      setEditingIssue(null);
    } catch (err) {
      console.error('Error saving as new issue:', err);
      alert('Failed to save as new record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.issues.delete(deleteConfirm.id);
      await loadIssues();
      setDeleteConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Error deleting issue:', err);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical': return 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400';
      case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-400';
      case 'Medium': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400';
      default: return 'text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const getStatusIcon = (s: IssueStatus) => {
    switch (s) {
      case 'Open': return <AlertCircle size={16} className="text-red-500" />;
      case 'In Progress': return <Clock size={16} className="text-blue-500" />;
      case 'Resolved': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'Closed': return <XCircle size={16} className="text-slate-400" />;
    }
  };

  const filtered = issues.filter(i =>
    i.description.toLowerCase().includes(search.toLowerCase()) ||
    i.issueId.toLowerCase().includes(search.toLowerCase()) ||
    i.moduleName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading Issues..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="p-2 -ml-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Migration Issues</h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">Track and resolve data migration blockers.</p>
          </div>
        </div>
        {hasPermission('Migration Issues', 'Create') && (
          <button
            onClick={() => { setEditingIssue(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-all"
          >
            <Plus size={18} />
            Report Issue
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search issues by ID, description or module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto notion-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                <th className="px-6 py-4">Issue ID</th>
                <th className="px-6 py-4">Status & Priority</th>
                <th className="px-6 py-4">Module / Area</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Reported</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filtered.map(issue => (
                <tr key={issue.issueId} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-slate-400">{issue.issueId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        {getStatusIcon(issue.status)}
                        {issue.status}
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase w-fit ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold">{issue.moduleName}</div>
                    <div className="text-[10px] text-slate-400">{issue.subModuleName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold truncate max-w-xs">{issue.title}</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 max-w-xs">{issue.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-400">{new Date(issue.reportedDate).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission('Migration Issues', 'Edit') && (
                        <button
                          onClick={() => {
                            setEditingIssue(issue);
                            setSelectedModule(issue.moduleName);
                            setShowModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit Issue"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                      {hasPermission('Migration Issues', 'Delete') && (
                        <button
                          onClick={() => handleDelete(issue.issueId)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Issue"
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
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                    All clear! No issues reported for this project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {
        showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto">
              <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingIssue ? 'Update Issue' : 'Report New Migration Issue'}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <XIcon size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Module</label>
                    <SearchableSelect
                      name="moduleName"
                      value={selectedModule}
                      onChange={(val) => setSelectedModule(String(val))}
                      options={uniqueModules.map(m => ({ label: m, value: m }))}
                      placeholder="Select Module"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Sub Module</label>
                    <SearchableSelect
                      name="subModuleName"
                      value={selectedSubModule}
                      onChange={(val) => setSelectedSubModule(String(val))}
                      options={availableSubModules.map(sm => ({ label: sm, value: sm }))}
                      placeholder="Select Sub-Module"
                      required
                      disabled={!selectedModule}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Title</label>
                  <input name="title" defaultValue={editingIssue?.title} required className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="Brief issue title" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Issue Description</label>
                  <textarea name="description" defaultValue={editingIssue?.description} required className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Priority</label>
                    <SearchableSelect
                      name="priority"
                      value={priority}
                      onChange={(val) => setPriority(String(val))}
                      options={[
                        { label: 'Low', value: 'Low' },
                        { label: 'Medium', value: 'Medium' },
                        { label: 'High', value: 'High' },
                        { label: 'Critical', value: 'Critical' }
                      ]}
                      placeholder="Select Priority"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Current Status</label>
                    <SearchableSelect
                      name="status"
                      value={status}
                      onChange={(val) => setStatus(val as IssueStatus)}
                      options={[
                        { label: 'Open', value: 'Open' },
                        { label: 'In Progress', value: 'In Progress' },
                        { label: 'Resolved', value: 'Resolved' },
                        { label: 'Closed', value: 'Closed' }
                      ]}
                      placeholder="Select Status"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Root Cause (If known)</label>
                  <textarea name="rootCause" defaultValue={editingIssue?.rootCause} className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[60px]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Solution Notes / Remarks</label>
                  <textarea name="remarks" defaultValue={editingIssue?.remarks} className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[60px]" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 rounded-xl font-bold">Cancel</button>
                  {editingIssue && hasPermission('Migration Issues', 'Create') && (
                    <button type="button" onClick={handleSaveAs} disabled={saving} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save As New'}
                    </button>
                  )}
                  {(editingIssue ? hasPermission('Migration Issues', 'Edit') : hasPermission('Migration Issues', 'Create')) && (
                    <button type="submit" disabled={saving} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all disabled:opacity-50">
                      {saving ? 'Saving...' : (editingIssue ? 'Update Issue' : 'Report Issue')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )
      }
      {/* Delete Confirmation Modal */}
      {
        deleteConfirm.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-zinc-800">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Trash2 size={24} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Issue</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-zinc-300 mb-6">
                  Are you sure you want to delete this migration issue? All data will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm({ show: false, id: null })}
                    className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

const XIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

export default MigrationIssues;
