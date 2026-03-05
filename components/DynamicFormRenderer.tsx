import React, { useState, useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { FieldMaster } from '../types';
import { api } from '../services/api';

interface DynamicFormRendererProps {
    fields: FieldMaster[];
    initialData?: Record<string, any>;
    onSubmit: (data: Record<string, any>) => void;
    onCancel?: () => void;
    isSubmitting?: boolean;
}

const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
    fields,
    initialData = {},
    onSubmit,
    onCancel,
    isSubmitting
}) => {
    const [formData, setFormData] = useState<Record<string, any>>(initialData);
    const [lookups, setLookups] = useState<Record<string, { label: string; value: string }[]>>({});
    const [loadingLookups, setLoadingLookups] = useState(false);

    // Initialize form with defaults
    useEffect(() => {
        const defaults: Record<string, any> = { ...initialData };
        fields.forEach(field => {
            if (defaults[field.fieldName] === undefined && field.defaultValue) {
                defaults[field.fieldName] = field.defaultValue;
            }
        });
        setFormData(defaults);
    }, [fields, initialData]);

    // Fetch Lookups
    useEffect(() => {
        const fetchLookups = async () => {
            // Fetch if SelectQueryDb is present, regardless of DataType
            const lookupFields = fields.filter(f => f.selectQueryDb && f.selectQueryDb.length > 0);
            if (lookupFields.length === 0) return;

            setLoadingLookups(true);
            const newLookups: Record<string, any[]> = {};

            try {
                await Promise.all(lookupFields.map(async (field) => {
                    if (!field.selectQueryDb) return;
                    // Avoid refetching if already exists (optimization)
                    if (lookups[field.selectQueryDb]) return;

                    const data = await api.fieldMaster.getLookupValues(field.selectQueryDb);
                    newLookups[field.selectQueryDb] = data.map(d => ({ label: d.lookupValue, value: d.lookupKey }));
                }));

                if (Object.keys(newLookups).length > 0) {
                    setLookups(prev => ({ ...prev, ...newLookups }));
                }
            } catch (err) {
                console.error('Error fetching lookups', err);
            } finally {
                setLoadingLookups(false);
            }
        };

        fetchLookups();
    }, [fields]);

    const handleChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderField = (field: FieldMaster) => {
        const commonClasses = "w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all";

        // Priority 1: If it has a Lookup Key, it's a Dropdown
        if (field.selectQueryDb && field.selectQueryDb.length > 0) {
            return (
                <SearchableSelect
                    name={field.fieldName}
                    required={field.isRequired}
                    value={formData[field.fieldName] || ''}
                    onChange={(val) => handleChange(field.fieldName, val)}
                    options={lookups[field.selectQueryDb] || []}
                    placeholder={`Select ${field.fieldLabel}`}
                    className="w-full"
                />
            );
        }

        // Priority 2: Data Type Mapping
        switch (field.dataType.toLowerCase()) {
            case 'text': // Maps to Text Area
            case 'textarea': // Legacy
                return (
                    <textarea
                        name={field.fieldName}
                        required={field.isRequired}
                        placeholder={field.placeholderText || field.fieldLabel}
                        value={formData[field.fieldName] || ''}
                        onChange={(e) => handleChange(field.fieldName, e.target.value)}
                        className={`${commonClasses} min-h-[100px]`}
                    />
                );

            case 'bit':
            case 'checkbox': // Legacy support
                return (
                    <label className="flex items-center gap-3 cursor-pointer p-2 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 transition-all">
                        <input
                            type="checkbox"
                            name={field.fieldName}
                            checked={!!formData[field.fieldName]}
                            onChange={(e) => handleChange(field.fieldName, e.target.checked)}
                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{field.fieldLabel}</span>
                    </label>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        name={field.fieldName}
                        required={field.isRequired}
                        value={formData[field.fieldName] ? (new Date(formData[field.fieldName]).toISOString().split('T')[0]) : ''}
                        onChange={(e) => handleChange(field.fieldName, e.target.value)}
                        className={commonClasses}
                    />
                );

            case 'datetime':
                return (
                    <input
                        type="datetime-local"
                        name={field.fieldName}
                        required={field.isRequired}
                        value={formData[field.fieldName] || ''}
                        onChange={(e) => handleChange(field.fieldName, e.target.value)}
                        className={commonClasses}
                    />
                );

            case 'int':
            case 'decimal':
            case 'float':
            case 'bigint':
            case 'number': // Legacy support
                return (
                    <input
                        type="number"
                        step={field.dataType === 'int' ? '1' : '0.01'}
                        name={field.fieldName}
                        required={field.isRequired}
                        placeholder={field.placeholderText || field.fieldLabel}
                        value={formData[field.fieldName] || ''}
                        onChange={(e) => handleChange(field.fieldName, e.target.value)}
                        className={commonClasses}
                    />
                );

            // Default to Text (nvarchar, varchar, etc.)
            default:
                return (
                    <input
                        type="text"
                        name={field.fieldName}
                        required={field.isRequired}
                        placeholder={field.placeholderText || field.fieldLabel}
                        value={formData[field.fieldName] || ''}
                        onChange={(e) => handleChange(field.fieldName, e.target.value)}
                        className={commonClasses}
                    />
                );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields
                    .filter(f => f.isActive && f.isDisplay !== false)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map(field => (
                        <div key={field.fieldId} className={(field.dataType === 'text' || field.dataType === 'textarea' || field.dataType === 'bit' || field.dataType === 'checkbox') ? 'md:col-span-2' : ''}>
                            {(field.dataType !== 'bit' && field.dataType !== 'checkbox') && (
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                                    {field.fieldLabel} {field.isRequired && <span className="text-red-500">*</span>}
                                </label>
                            )}
                            {renderField(field)}
                            {field.helpText && <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>}
                        </div>
                    ))}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-zinc-800">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};

export default DynamicFormRenderer;
