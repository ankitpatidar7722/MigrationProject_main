import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { FieldMaster, DynamicModuleData } from '../types';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import { Loader2, Database, ArrowLeft } from 'lucide-react';
import { LoadingOverlay } from '../components/LoadingOverlay';

const DynamicModulePage: React.FC = () => {
  // We expect projectId and moduleGroupId in params
  // Currently the router might not support moduleGroupId param yet, 
  // so we might need to rely on query or context, OR map specific routes to IDs
  const { projectId: projectIdStr, moduleName } = useParams<{ projectId: string; moduleName: string }>();
  const projectId = parseInt(projectIdStr || '0');

  // Mapping moduleName (from URL) to moduleGroupId (database)
  // In a real app, this might be fetched or passed via state.
  // For now, hardcode based on user prompt examples:
  // "Customization" -> 3
  const getModuleGroupId = (name: string) => {
    switch (name?.toLowerCase()) {
      case 'customization': return 3;
      case 'migration-issues': return 4;
      // Add others as needed
      default: return 3; // Defaulting to customization for demo
    }
  };

  const moduleGroupId = getModuleGroupId(moduleName || '');

  const [fields, setFields] = useState<FieldMaster[]>([]);
  const [existingData, setExistingData] = useState<any>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (projectId && moduleGroupId) {
      loadData();
    }
  }, [projectId, moduleGroupId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Field Definitions
      const fieldsData = await api.fieldMaster.getByModuleGroup(moduleGroupId);
      setFields(fieldsData);

      // 2. Fetch Existing Data
      const moduleDataList = await api.moduleData.get(projectId, moduleGroupId);
      if (moduleDataList && moduleDataList.length > 0) {
        // Assuming one record per module for now (Singleton pattern for customization)
        // If it's a list (like Issues), we'd need a list view first. 
        // For "Customization Checklist", it's likely a single form for the project.
        const latest = moduleDataList[0];
        setRecordId(latest.recordId);
        if (latest.jsonData) {
          setExistingData(JSON.parse(latest.jsonData));
        }
      }
    } catch (err) {
      console.error('Failed to load dynamic module', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const payload: DynamicModuleData = {
        // If recordId exists, use it, else generic new ID (backend might generate or we gen UUID)
        recordId: recordId || crypto.randomUUID(),
        projectId: projectId,
        moduleGroupId: moduleGroupId,
        jsonData: JSON.stringify(formData),
        status: 'Active',
        isCompleted: false // Logic to determine completion?
      };

      if (recordId) {
        await api.moduleData.update(recordId, payload);
      } else {
        const created = await api.moduleData.create(payload);
        setRecordId(created.recordId);
      }
      alert('Saved successfully!');
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save data.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading Module..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link to={`/projects/${projectId}`} className="p-2 -ml-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Database size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold capitalize">{moduleName?.replace('-', ' ')} Module</h1>
          <p className="text-slate-500">Dynamic Data Entry</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-zinc-800">
        {fields.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No fields configured for this module.</p>
            <p className="text-sm mt-2">Go to Field Manager to configure fields.</p>
          </div>
        ) : (
          <DynamicFormRenderer
            fields={fields}
            initialData={existingData}
            onSubmit={handleSave}
            isSubmitting={saving}
          />
        )}
      </div>
    </div>
  );
};

export default DynamicModulePage;
