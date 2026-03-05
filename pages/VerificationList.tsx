
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { VerificationRecord, VerificationStatus, ModuleMaster, FieldMaster, WebTable } from '../types';
import { Plus, Search, Filter, Trash2, Edit3, Download, Check, Code, MessageSquare, Info, ShieldCheck, Loader2, Copy, ArrowLeft } from 'lucide-react';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useRefresh } from '../services/RefreshContext';
import { useLanguage } from '../services/LanguageContext';

const VerificationList: React.FC = () => {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = projectIdStr ? parseInt(projectIdStr, 10) : 0;
  const { hasPermission } = useAuth();
  const { t } = useLanguage();

  const [items, setItems] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<VerificationRecord | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus>('Pending');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });

  const [moduleMasters, setModuleMasters] = useState<ModuleMaster[]>([]);
  const [webTables, setWebTables] = useState<WebTable[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedDesktopTable, setSelectedDesktopTable] = useState<string>('');
  const [selectedWebTable, setSelectedWebTable] = useState<string>('');
  const [fields, setFields] = useState<FieldMaster[]>([]);

  const { registerRefresh } = useRefresh();

  const loadItems = async () => {
    if (!projectId) return;
    try {
      const [data, modules, fieldData, tables] = await Promise.all([
        api.verification.getByProject(projectId),
        api.moduleMaster.getAll(),
        api.fieldMaster.getAll(),
        api.webTables.getAll()
      ]);
      setItems(data);
      setModuleMasters(modules);
      setFields(fieldData);
      setWebTables(tables);
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
      setSelectedDesktopTable(editingItem.tableNameDesktop || '');
      setSelectedWebTable(editingItem.tableNameWeb || '');
    } else {
      setSelectedModule('');
      setSelectedDesktopTable('');
      setSelectedWebTable('');
    }
  }, [editingItem]);

  const uniqueModules = Array.from(new Set(moduleMasters.map(m => m.moduleName)));
  const availableSubModules = moduleMasters
    .filter(m => m.moduleName === selectedModule)
    .map(m => m.subModuleName);

  // Filter Web Tables based on selected Module's GroupIndex (Borrowed from TransferChecks)
  const availableTables = React.useMemo(() => {
    if (!selectedModule) return [];
    // Find the group index of the selected module
    const moduleInfo = moduleMasters.find(m => m.moduleName === selectedModule);
    if (!moduleInfo || moduleInfo.groupIndex === undefined) return [];
    return webTables.filter(t => t.groupIndex === moduleInfo.groupIndex);
  }, [selectedModule, moduleMasters, webTables]);

  const distinctDesktopTables = Array.from(new Set(availableTables.map(t => t.desktopTableName).filter(Boolean)));
  const distinctWebTables = Array.from(new Set(availableTables.map(t => t.tableName).filter(Boolean)));


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const itemData: VerificationRecord = {
        verificationId: editingItem?.verificationId,
        projectId: projectId,
        moduleName: formData.get('moduleName') as string,
        subModuleName: formData.get('subModuleName') as string,
        fieldName: formData.get('fieldName') as string,
        tableNameDesktop: formData.get('tableNameDesktop') as string,
        tableNameWeb: formData.get('tableNameWeb') as string,
        description: formData.get('description') as string,
        status: selectedStatus,
        sqlQuery: formData.get('sqlQuery') as string,
        expectedResult: formData.get('expectedResult') as string || '',
        actualResult: formData.get('actualResult') as string || '',
        isVerified: selectedStatus === 'Correct',
        comments: editingItem?.comments || ''
      };

      if (editingItem?.verificationId) {
        await api.verification.update(editingItem.verificationId, itemData);
      } else {
        await api.verification.create(itemData);
      }

      await loadItems();
      setShowModal(false);
      setEditingItem(null);
      setSelectedStatus('Pending');
    } catch (err) {
      console.error('Error saving verification:', err);
      alert('Failed to save verification. Please try again.');
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

      const newItem: VerificationRecord = {
        // ID generated by backend
        projectId: projectId,
        moduleName: formData.get('moduleName') as string,
        subModuleName: formData.get('subModuleName') as string,
        fieldName: formData.get('fieldName') as string,
        tableNameDesktop: formData.get('tableNameDesktop') as string,
        tableNameWeb: formData.get('tableNameWeb') as string,
        description: formData.get('description') as string,
        status: selectedStatus,
        sqlQuery: formData.get('sqlQuery') as string,
        expectedResult: formData.get('expectedResult') as string || '',
        actualResult: formData.get('actualResult') as string || '',
        isVerified: selectedStatus === 'Correct',
        comments: ''
      };

      await api.verification.create(newItem);
      await loadItems();
      setShowModal(false);
      setEditingItem(null);
      setSelectedStatus('Pending');
    } catch (err) {
      console.error('Error saving as new verification:', err);
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
      await api.verification.delete(deleteConfirm.id);
      await loadItems();
      setDeleteConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Error deleting verification:', err);
      alert('Failed to delete record. Please try again.');
    }
  };

  const filtered = items.filter(i =>
    i.moduleName.toLowerCase().includes(search.toLowerCase()) ||
    i.fieldName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <LoadingOverlay isVisible={true} message={t('loading_data')} />;
  }

  // Helper to get status color
  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'Correct': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Incorrect': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-zinc-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="p-2 -ml-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t('verification_list')}</h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">{t('audit_verify_description')}</p>
          </div>
        </div>
        {hasPermission('Verification List', 'Create') && (
          <button
            onClick={() => {
              setEditingItem(null);
              setSelectedStatus('Pending');
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
          >
            <Plus size={18} />
            {t('new_verification')}
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder={t('filter_verification_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(item => (
          <div key={item.verificationId} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                      {t(item.status.toLowerCase()) || item.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{item.moduleName} / {item.subModuleName}</span>
                  </div>
                  <h3 className="text-lg font-bold">{item.fieldName}</h3>
                  <div className="flex gap-4 mt-2 mb-2 text-xs font-mono text-slate-500">
                    {item.tableNameDesktop && <span className="bg-slate-100 px-2 py-1 rounded">DT: {item.tableNameDesktop}</span>}
                    {item.tableNameWeb && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">WT: {item.tableNameWeb}</span>}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasPermission('Verification List', 'Edit') && (
                    <button onClick={() => {
                      setEditingItem(item);
                      setSelectedModule(item.moduleName);
                      setSelectedStatus(item.status);
                      setShowModal(true);
                    }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Edit3 size={18} />
                    </button>
                  )}
                  {hasPermission('Verification List', 'Delete') && (
                    <button
                      onClick={() => item.verificationId && setDeleteConfirm({ show: true, id: item.verificationId })}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {item.sqlQuery && (
                <div className="mt-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                      <Code size={14} />
                      <span className="text-xs font-bold uppercase">{t('sql_query_reference')}</span>
                    </div>
                    <CopyButton text={item.sqlQuery} />
                  </div>
                  <pre className="text-xs font-mono text-slate-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                    {item.sqlQuery}
                  </pre>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <MessageSquare size={14} />
                    {item.comments ? t('has_comments') : t('no_comments')}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <Check size={14} className={item.isVerified ? 'text-emerald-500' : 'text-slate-300'} />
                    {item.isVerified ? t('verified') : t('unverified')}
                  </div>
                </div>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700">{t('add_comment')}</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-20 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl border-dashed">
            <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold">{t('no_verification_items')}</h3>
            <p className="text-slate-500 dark:text-zinc-400">{t('create_tests_data_integrity')}</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingItem ? t('edit_verification') : t('add_new_verification')}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('module_name')}</label>
                  <select
                    name="moduleName"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="" disabled hidden>{t('select_module')}</option>
                    {uniqueModules.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('sub_module')}</label>
                  <select
                    name="subModuleName"
                    defaultValue={editingItem?.subModuleName}
                    required
                    disabled={!selectedModule}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                  >
                    <option value="" disabled hidden>{t('select_sub_module')}</option>
                    {availableSubModules.map(sm => (
                      <option key={sm} value={sm}>{sm}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('desktop_table')}</label>
                  <select
                    name="tableNameDesktop"
                    defaultValue={editingItem?.tableNameDesktop || ""}
                    disabled={!selectedModule}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-50"
                  >
                    <option value="" disabled hidden>{t('select_desktop_table')}</option>
                    {distinctDesktopTables.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('web_table')}</label>
                  <select
                    name="tableNameWeb"
                    defaultValue={editingItem?.tableNameWeb || ""}
                    disabled={!selectedModule}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-50"
                  >
                    <option value="" disabled hidden>{t('select_web_table')}</option>
                    {distinctWebTables.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('field_logic_name')}</label>
                <div className="relative">
                  <input
                    name="fieldName"
                    list="verification-fields"
                    defaultValue={editingItem?.fieldName}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={t('field_logic_name_placeholder')}
                  />
                  <datalist id="verification-fields">
                    {fields.filter(f => f.moduleGroupId === 1002 && f.isDisplay !== false).map(f => (
                      <option key={f.fieldId} value={f.fieldLabel} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('description_notes')}</label>
                <textarea name="description" defaultValue={editingItem?.description} className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('sql_query_reference')}</label>
                <textarea name="sqlQuery" defaultValue={editingItem?.sqlQuery} className="w-full px-4 py-3 bg-slate-900 text-emerald-400 font-mono text-xs border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px]" placeholder={t('sql_query_placeholder')} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-500">{t('status')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Pending', 'Correct', 'Incorrect', 'Re-verify'] as VerificationStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`flex items-center justify-center py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${selectedStatus === st
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-zinc-800 border-transparent hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                    >
                      {t(st.toLowerCase()) || st}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 rounded-xl font-bold">{t('cancel')}</button>
                {editingItem && hasPermission('Verification List', 'Create') && (
                  <button type="button" onClick={handleSaveAs} disabled={saving} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                    {saving ? t('saving') : t('save_as_new')}
                  </button>
                )}
                {(editingItem ? hasPermission('Verification List', 'Edit') : hasPermission('Verification List', 'Create')) && (
                  <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                    {saving ? t('saving') : (editingItem ? t('update_verification') : t('save_verification'))}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-zinc-800">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('delete_verification')}</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">{t('action_cannot_be_undone')}</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-zinc-300 mb-6">
                {t('confirm_delete_verification_message')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: null })}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all"
                >
                  {t('delete')}
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

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md transition-colors text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      title="Copy SQL query"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
};

export default VerificationList;
