import React, { useEffect, useState } from 'react';
import { UserPermission, AppModules } from '../types';

interface PermissionMatrixProps {
    permissions: UserPermission[];
    onChange: (permissions: UserPermission[]) => void;
    readOnly?: boolean;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ permissions, onChange, readOnly = false }) => {
    const [localPermissions, setLocalPermissions] = useState<UserPermission[]>([]);

    useEffect(() => {
        // Initialize permissions if not present for some modules
        const initializedPermissions = AppModules.map(moduleName => {
            const existing = permissions.find(p => p.moduleName === moduleName);
            return existing || {
                id: 0,
                userId: 0,
                moduleName,
                canView: false,
                canCreate: false,
                canEdit: false,
                canSave: false,
                canDelete: false
            };
        });
        setLocalPermissions(initializedPermissions);
    }, [permissions]); // Only re-run if prop changes significantly (though deep comparison is hard here)

    const handleCheck = (moduleName: string, field: keyof UserPermission, checked: boolean) => {
        if (readOnly) return;

        const updated = localPermissions.map(p => {
            if (p.moduleName === moduleName) {
                return { ...p, [field]: checked };
            }
            return p;
        });

        setLocalPermissions(updated);
        onChange(updated);
    };

    const handleSelectAll = (field: keyof Omit<UserPermission, 'id' | 'userId' | 'moduleName'>) => {
        if (readOnly) return;

        const allChecked = localPermissions.every(p => p[field]);
        const updated = localPermissions.map(p => ({ ...p, [field]: !allChecked }));

        setLocalPermissions(updated);
        onChange(updated);
    }

    return (
        <div className="overflow-x-auto border border-slate-200 dark:border-zinc-700 rounded-xl shadow-sm bg-white dark:bg-zinc-800">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-zinc-900 font-semibold text-slate-700 dark:text-zinc-300">
                    <tr>
                        <th className="p-3 border-b dark:border-zinc-700 min-w-[200px]">Module</th>
                        {(['canView', 'canCreate', 'canEdit', 'canSave', 'canDelete'] as const).map(field => (
                            <th key={field} className="p-3 border-b dark:border-zinc-700 text-center min-w-[80px]">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="capitalize">{field.replace('can', '')}</span>
                                    <input
                                        type="checkbox"
                                        checked={localPermissions.length > 0 && localPermissions.every(p => p[field])}
                                        onChange={() => handleSelectAll(field)}
                                        disabled={readOnly}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        title="Select All"
                                    />
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {localPermissions.map((perm) => (
                        <tr key={perm.moduleName} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                            <td className="p-3 font-medium text-slate-900 dark:text-zinc-100">{perm.moduleName}</td>
                            {(['canView', 'canCreate', 'canEdit', 'canSave', 'canDelete'] as const).map(field => (
                                <td key={field} className="p-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={!!perm[field]}
                                        onChange={(e) => handleCheck(perm.moduleName, field, e.target.checked)}
                                        disabled={readOnly}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
