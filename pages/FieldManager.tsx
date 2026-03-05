import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FieldMaster, ModuleGroup } from '../types';
import { Plus, Trash2, Edit3, Save, X, Move, Check } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

const FieldManager: React.FC = () => {
  const { hasPermission } = useAuth();
  const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([]); // Assuming we have this type, or will fetch from API
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [fields, setFields] = useState<FieldMaster[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<FieldMaster | null>(null);
  const [saving, setSaving] = useState(false);

  // Load Module Groups on mount (Using ModuleMaster or hardcoded for now if separate API not ready, ideally ModuleGroup API)
  // Since User mentioned separate ModuleGroupMaster, let's assume valid ID 1-4 for now or fetch if available. 
  // Wait, API has `api.moduleMaster.getAll`. Let's use that but check if it returns Groups or Modules. 
  // The user prompt says "ModuleGroupMaster ... examples ID 1,2,3...". 
  // Let's assume we can fetch groups. If `api.moduleMaster` returns modules, we might need a `ModuleGroup` API.
  // For now, I will hardcode the groups mentioned in the prompt to ensure it works immediately.
  const groups = [
    { id: 1001, name: 'Data Transfer Checklist' },
    { id: 1002, name: 'Verification List' },
    { id: 1003, name: 'Customization' },
    { id: 1004, name: 'Migration Issues' }
  ];

  useEffect(() => {
    // Default to Customization (ID: 3) on load
    if (selectedGroupId === 0) {
      setSelectedGroupId(3);
    }
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadFields(selectedGroupId);
    } else {
      setFields([]);
    }
  }, [selectedGroupId]);

  const loadFields = async (groupId: number) => {
    setLoading(true);
    try {
      const data = await api.fieldMaster.getByModuleGroup(groupId);
      setFields(data);
    } catch (err) {
      console.error('Failed to load fields', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.fieldMaster.delete(id);
      loadFields(selectedGroupId);
    } catch (err) {
      alert('Failed to delete');
    }
  };

  // Helper to map UI Data Type to DB Data Type + MaxLength
  const mapUiTypeToDb = (uiType: string, formMaxLength: number): { dataType: string; maxLength: number } => {
    switch (uiType) {
      case 'NVARCHAR(100)': return { dataType: 'nvarchar', maxLength: 100 };
      case 'NVARCHAR(MAX)': return { dataType: 'text', maxLength: 0 }; // Using 'text' for long content as per schema implication
      case 'INT': return { dataType: 'int', maxLength: 0 };
      case 'DECIMAL(18,2)': return { dataType: 'decimal', maxLength: 0 };
      case 'BIT': return { dataType: 'bit', maxLength: 0 };
      case 'DATE': return { dataType: 'date', maxLength: 0 };
      case 'DATETIME': return { dataType: 'datetime', maxLength: 0 };
      default: return { dataType: 'nvarchar', maxLength: formMaxLength || 100 }; // Default fallback
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const uiDataType = formData.get('dataType') as string;
    const { dataType, maxLength } = mapUiTypeToDb(uiDataType, Number(formData.get('maxLength')));

    const fieldData: any = {
      fieldId: editingField?.fieldId || 0,
      moduleGroupId: selectedGroupId,
      fieldName: formData.get('fieldName'),
      fieldLabel: formData.get('fieldLabel'),
      fieldDescription: formData.get('fieldDescription'),
      dataType: dataType,
      maxLength: maxLength,
      isRequired: formData.get('isRequired') === 'on',
      isUnique: formData.get('isUnique') === 'on',
      isActive: formData.get('isActive') === 'on',
      displayOrder: Number(formData.get('displayOrder')) || 0,
      defaultValue: formData.get('defaultValue'),
      isDisplay: formData.get('isDisplay') === 'on',
      selectQueryDb: formData.get('selectQueryDb'),
      validationRegex: formData.get('validationRegex'),
      placeholderText: formData.get('placeholderText'),
      helpText: formData.get('helpText'),
    };

    try {
      if (editingField) {
        await api.fieldMaster.update(editingField.fieldId, fieldData);
      } else {
        await api.fieldMaster.create(fieldData);
      }
      setShowModal(false);
      setEditingField(null);
      loadFields(selectedGroupId);
    } catch (err) {
      console.error(err);
      alert('Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAs = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setSaving(true);
    const button = e.currentTarget;
    const form = button.closest('form');
    if (!form) return;

    const formData = new FormData(form);
    const uiDataType = formData.get('dataType') as string;
    const { dataType, maxLength } = mapUiTypeToDb(uiDataType, Number(formData.get('maxLength')));

    const fieldData: any = {
      fieldId: 0, // Force new ID
      moduleGroupId: selectedGroupId,
      fieldName: formData.get('fieldName'),
      fieldLabel: formData.get('fieldLabel'),
      fieldDescription: formData.get('fieldDescription'),
      dataType: dataType,
      maxLength: maxLength,
      isRequired: formData.get('isRequired') === 'on',
      isUnique: formData.get('isUnique') === 'on',
      isActive: formData.get('isActive') === 'on',
      displayOrder: (Number(formData.get('displayOrder')) || 0) + 10,
      defaultValue: formData.get('defaultValue'),
      isDisplay: formData.get('isDisplay') === 'on',
      selectQueryDb: formData.get('selectQueryDb'),
      validationRegex: formData.get('validationRegex'),
      placeholderText: formData.get('placeholderText'),
      helpText: formData.get('helpText'),
    };

    try {
      await api.fieldMaster.create(fieldData);
      setShowModal(false);
      setEditingField(null);
      loadFields(selectedGroupId);
      alert('Field cloned successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to clone field');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Field Manager</h1>
          <p className="text-slate-500">Configure dynamic fields for modules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar: Module Groups */}
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 px-2">Module Groups</h3>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroupId(g.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedGroupId === g.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-zinc-900 text-slate-600 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Main Content: Fields List */}
        <div className="md:col-span-3">
          {!selectedGroupId ? (
            <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400">Select a module group to view fields</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="font-bold text-lg">Fields ({fields.length})</h2>
                {hasPermission('Fields', 'Create') && (
                  <button
                    disabled={selectedGroupId === 0}
                    onClick={() => { setEditingField(null); setShowModal(true); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${selectedGroupId === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    <Plus size={18} /> Add Field
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-zinc-800">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Order</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Label</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Name (DB)</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Required</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Display</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {fields.map(field => (
                      <tr key={field.fieldId} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <td className="p-4 font-mono text-sm text-slate-400">{field.displayOrder}</td>
                        <td className="p-4 font-medium">{field.fieldLabel}</td>
                        <td className="p-4 text-sm text-slate-500 font-mono">{field.fieldName}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded text-xs font-bold uppercase text-slate-600">
                            {field.dataType}
                          </span>
                        </td>
                        <td className="p-4">
                          {field.isRequired && <Check size={16} className="text-emerald-500" />}
                        </td>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={field.isDisplay !== false}
                            onChange={async (e) => {
                              const newDisplay = e.target.checked;
                              // Optimistic UI update
                              setFields(fields.map(f => f.fieldId === field.fieldId ? { ...f, isDisplay: newDisplay } : f));
                              try {
                                await api.fieldMaster.update(field.fieldId, { ...field, isDisplay: newDisplay });
                              } catch (err) {
                                console.error('Failed to update display status', err);
                                // Revert on failure
                                loadFields(selectedGroupId);
                              }
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {hasPermission('Fields', 'Edit') && (
                            <button
                              onClick={() => { setEditingField(field); setShowModal(true); }}
                              className="p-2 text-slate-400 hover:text-blue-600 transition"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                          {hasPermission('Fields', 'Delete') && (
                            <button
                              onClick={() => handleDelete(field.fieldId)}
                              className="p-2 text-slate-400 hover:text-red-600 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {fields.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">No fields configured yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSave}>
              <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <h2 className="text-xl font-bold">{editingField ? 'Edit Field' : 'New Field'}</h2>
                <button type="button" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Field Label <span className="text-red-500">*</span></label>
                  <input name="fieldLabel" required defaultValue={editingField?.fieldLabel} className="w-full px-4 py-2 bg-slate-50 border rounded-lg" placeholder="e.g. Client Name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Field Name (DB) <span className="text-red-500">*</span></label>
                  <input name="fieldName" required defaultValue={editingField?.fieldName} className="w-full px-4 py-2 bg-slate-50 border rounded-lg font-mono" placeholder="e.g. ClientName" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Data Type <span className="text-red-500">*</span></label>
                  <select
                    name="dataType"
                    required
                    defaultValue={
                      editingField?.dataType === 'text' ? 'NVARCHAR(MAX)' :
                        editingField?.dataType === 'int' ? 'INT' :
                          editingField?.dataType === 'bit' ? 'BIT' :
                            editingField?.dataType === 'date' ? 'DATE' :
                              editingField?.dataType === 'datetime' ? 'DATETIME' :
                                editingField?.dataType === 'decimal' ? 'DECIMAL(18,2)' :
                                  'NVARCHAR(100)' // Default to NVARCHAR(100) if nvarchar or unknown
                    }
                    className="w-full px-4 py-2 bg-slate-50 border rounded-lg"
                  >
                    <option value="NVARCHAR(100)">NVARCHAR(100) (Text)</option>
                    <option value="NVARCHAR(MAX)">NVARCHAR(MAX) (Long Text)</option>
                    <option value="INT">INT (Number)</option>
                    <option value="DECIMAL(18,2)">DECIMAL(18,2) (Currency/Amount)</option>
                    <option value="BIT">BIT (Checkbox/Boolean)</option>
                    <option value="DATE">DATE</option>
                    <option value="DATETIME">DATETIME</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Display Order</label>
                  <input name="displayOrder" type="number" defaultValue={editingField?.displayOrder || 0} className="w-full px-4 py-2 bg-slate-50 border rounded-lg" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Description / Help Text</label>
                  <input name="fieldDescription" defaultValue={editingField?.fieldDescription || ''} className="w-full px-4 py-2 bg-slate-50 border rounded-lg" placeholder="Tooltip for users" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Lookup Key (for Dropdowns)</label>
                  <input name="selectQueryDb" defaultValue={editingField?.selectQueryDb || ''} className="w-full px-4 py-2 bg-slate-50 border rounded-lg" placeholder="e.g. ProjectType" />
                  <p className="text-xs text-slate-500 mt-1">If populated, this field will render as a Dropdown (regardless of Data Type).</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Default Value</label>
                  <input name="defaultValue" defaultValue={editingField?.defaultValue || ''} className="w-full px-4 py-2 bg-slate-50 border rounded-lg" />
                </div>

                <div className="flex gap-6 items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isRequired" defaultChecked={editingField?.isRequired} className="w-4 h-4" />
                    <span className="text-sm font-medium">Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isUnique" defaultChecked={editingField?.isUnique} className="w-4 h-4" />
                    <span className="text-sm font-medium">Unique</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isActive" defaultChecked={editingField?.isActive ?? true} className="w-4 h-4" />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isDisplay" defaultChecked={editingField?.isDisplay ?? true} className="w-4 h-4" />
                    <span className="text-sm font-medium">Display on UI</span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg border bg-white hover:bg-slate-50">Cancel</button>

                {editingField && (
                  <button
                    type="button"
                    onClick={handleSaveAs}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save As New'}
                  </button>
                )}

                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50">
                  {saving ? 'Saving...' : (editingField ? 'Update Field' : 'Save Field')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldManager;
