
import React from 'react';
import { FieldMaster, DataType } from '../types';
import { X, Save } from 'lucide-react';

interface Props {
  fields: FieldMaster[];
  initialData?: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
  title: string;
}

const DynamicForm: React.FC<Props> = ({ fields, initialData, onSave, onCancel, title }) => {
  const [formData, setFormData] = React.useState<Record<string, any>>(initialData || {});

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderInput = (field: FieldMaster) => {
    const value = formData[field.fieldName] ?? field.defaultValue;

    switch (field.dataType) {
      case 'bit':
        return (
          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleChange(field.fieldName, e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{field.fieldDescription}</span>
          </div>
        );
      case 'text':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.fieldName, e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            placeholder={field.fieldDescription}
          />
        );
      case 'dropdown':
        const options = field.selectQueryDb.replace('SELECT ', '').split(',').map(o => o.trim().replace(/"/g, ''));
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.fieldName, e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      default:
        return (
          <input
            type={field.dataType === 'date' ? 'date' : 'text'}
            value={value}
            onChange={(e) => handleChange(field.fieldName, e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.fieldDescription}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/50">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 max-h-[70vh] overflow-y-auto notion-scrollbar space-y-6">
          {fields.map(field => (
            <div key={field.fieldId} className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 px-1">
                {field.fieldName} {field.isRequired && <span className="text-red-500">*</span>}
              </label>
              {renderInput(field)}
            </div>
          ))}
        </div>
        <div className="p-6 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl font-medium">Cancel</button>
          <button 
            onClick={() => onSave(formData)}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicForm;
