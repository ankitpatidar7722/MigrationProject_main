
import {
  FieldMaster,
  Project,
  DynamicModuleData,
  DataTransferCheck,
  VerificationRecord,
  MigrationIssue,
  CustomizationPoint,
  ModuleMaster,
  ProjectEmail,
  WebTable,
  ServerData,
  DatabaseDetail,
  ManualConfiguration,
  ExcelData,
  User,
  QuickWork
} from '../types';

/**
 * Complete API Service for MigraTrack Pro
 * Connects React Frontend to .NET Core Backend API
 * Backend URL: Configured via VITE_API_URL environment variable (default: localhost)
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API Error: ${response.status}`);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
};

export const api = {
  // ==================== SERVERS & DATABASES ====================
  serverData: {
    getAll: async (): Promise<ServerData[]> => {
      const response = await fetch(`${BASE_URL}/ServerData`);
      return handleResponse<ServerData[]>(response);
    },
    getById: async (id: number): Promise<ServerData> => {
      const response = await fetch(`${BASE_URL}/ServerData/${id}`);
      return handleResponse<ServerData>(response);
    },
    create: async (item: ServerData): Promise<ServerData> => {
      const response = await fetch(`${BASE_URL}/ServerData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<ServerData>(response);
    },
    update: async (id: number, item: ServerData): Promise<ServerData> => {
      const response = await fetch(`${BASE_URL}/ServerData/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<ServerData>(response);
    },
    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/ServerData/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    }
  },

  databaseDetails: {
    getAll: async (): Promise<DatabaseDetail[]> => {
      const response = await fetch(`${BASE_URL}/DatabaseDetail`);
      return handleResponse<DatabaseDetail[]>(response);
    },
    getByServer: async (serverId: number): Promise<DatabaseDetail[]> => {
      const response = await fetch(`${BASE_URL}/DatabaseDetail/server/${serverId}`);
      return handleResponse<DatabaseDetail[]>(response);
    },
    getById: async (id: number): Promise<DatabaseDetail> => {
      const response = await fetch(`${BASE_URL}/DatabaseDetail/${id}`);
      return handleResponse<DatabaseDetail>(response);
    },
    create: async (item: DatabaseDetail): Promise<DatabaseDetail> => {
      const response = await fetch(`${BASE_URL}/DatabaseDetail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<DatabaseDetail>(response);
    },
    update: async (id: number, item: DatabaseDetail): Promise<DatabaseDetail> => {
      const response = await fetch(`${BASE_URL}/DatabaseDetail/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<DatabaseDetail>(response);
    },
    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/DatabaseDetail/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    }
  },

  // ==================== AUTH ====================
  auth: {
    login: async (credentials: any) => {
      const response = await fetch(`${BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      return handleResponse<{ user: any, token: string }>(response);
    },
  },

  // ==================== PROJECTS ====================
  projects: {
    getAll: async (): Promise<Project[]> => {
      const response = await fetch(`${BASE_URL}/Projects`);
      return handleResponse<Project[]>(response);
    },

    getById: async (id: number): Promise<Project> => {
      const response = await fetch(`${BASE_URL}/Projects/${id}`);
      return handleResponse<Project>(response);
    },

    create: async (project: Project): Promise<Project> => {
      const response = await fetch(`${BASE_URL}/Projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      return handleResponse<Project>(response);
    },

    update: async (id: number, project: Project): Promise<Project> => {
      const response = await fetch(`${BASE_URL}/Projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      return handleResponse<Project>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/Projects/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    },

    getDashboard: async (id: number): Promise<any> => {
      const response = await fetch(`${BASE_URL}/Projects/${id}/dashboard`);
      return handleResponse<any>(response);
    },

    getDashboardSummary: async (): Promise<Record<number, any>> => {
      const response = await fetch(`${BASE_URL}/Projects/dashboard-summary`);
      return handleResponse<Record<number, any>>(response);
    },

    getDashboardAll: async (): Promise<{ projects: any[]; transfers: any[]; issues: any[]; stats: Record<number, any> }> => {
      const response = await fetch(`${BASE_URL}/Projects/dashboard-all`);
      return handleResponse<{ projects: any[]; transfers: any[]; issues: any[]; stats: Record<number, any> }>(response);
    },

    clone: async (sourceId: number, targetId: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/Projects/${sourceId}/clone/${targetId}`, {
        method: 'POST'
      });
      return handleResponse<void>(response);
    },

    reorder: async (projects: Project[]): Promise<void> => {
      const response = await fetch(`${BASE_URL}/Projects/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projects),
      });
      return handleResponse<void>(response);
    },
  },

  // ==================== DATA TRANSFER CHECKS ====================
  dataTransfer: {
    getAll: async (): Promise<DataTransferCheck[]> => {
      const response = await fetch(`${BASE_URL}/DataTransfer/all`);
      return handleResponse<DataTransferCheck[]>(response);
    },

    getByProject: async (projectId: number): Promise<DataTransferCheck[]> => {
      const response = await fetch(`${BASE_URL}/DataTransfer/project/${projectId}`);
      return handleResponse<DataTransferCheck[]>(response);
    },

    getById: async (id: number): Promise<DataTransferCheck> => {
      const response = await fetch(`${BASE_URL}/DataTransfer/${id}`);
      return handleResponse<DataTransferCheck>(response);
    },

    create: async (data: DataTransferCheck): Promise<DataTransferCheck> => {
      const response = await fetch(`${BASE_URL}/DataTransfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<DataTransferCheck>(response);
    },

    update: async (id: number, data: DataTransferCheck): Promise<DataTransferCheck> => {
      const response = await fetch(`${BASE_URL}/DataTransfer/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<DataTransferCheck>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/DataTransfer/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete record');
      }
    },
  },

  // ==================== VERIFICATION RECORDS ====================
  verification: {
    getByProject: async (projectId: number): Promise<VerificationRecord[]> => {
      const response = await fetch(`${BASE_URL}/Verification/project/${projectId}`);
      return handleResponse<VerificationRecord[]>(response);
    },

    getById: async (id: number): Promise<VerificationRecord> => {
      const response = await fetch(`${BASE_URL}/Verification/${id}`);
      return handleResponse<VerificationRecord>(response);
    },

    create: async (data: VerificationRecord): Promise<VerificationRecord> => {
      const response = await fetch(`${BASE_URL}/Verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<VerificationRecord>(response);
    },

    update: async (id: number, data: VerificationRecord): Promise<VerificationRecord> => {
      const response = await fetch(`${BASE_URL}/Verification/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<VerificationRecord>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/Verification/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete record');
      }
    },
  },

  // ==================== MIGRATION ISSUES ====================
  issues: {
    getAll: async (): Promise<MigrationIssue[]> => {
      const response = await fetch(`${BASE_URL}/Issues/all`);
      return handleResponse<MigrationIssue[]>(response);
    },

    getByProject: async (projectId: number): Promise<MigrationIssue[]> => {
      const response = await fetch(`${BASE_URL}/Issues/project/${projectId}`);
      return handleResponse<MigrationIssue[]>(response);
    },

    getById: async (id: string): Promise<MigrationIssue> => {
      const response = await fetch(`${BASE_URL}/Issues/${id}`);
      return handleResponse<MigrationIssue>(response);
    },

    create: async (item: MigrationIssue): Promise<MigrationIssue> => {
      const response = await fetch(`${BASE_URL}/Issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<MigrationIssue>(response);
    },

    update: async (id: string, item: MigrationIssue): Promise<MigrationIssue> => {
      const response = await fetch(`${BASE_URL}/Issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<MigrationIssue>(response);
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${BASE_URL}/Issues/${id}`, {
        method: 'DELETE',
      });
      return handleResponse<void>(response);
    },
  },

  // ==================== CUSTOMIZATION POINTS ====================
  customization: {
    getByProject: async (projectId: number): Promise<CustomizationPoint[]> => {
      const response = await fetch(`${BASE_URL}/Customization/project/${projectId}`);
      return handleResponse<CustomizationPoint[]>(response);
    },

    getById: async (id: number): Promise<CustomizationPoint> => {
      const response = await fetch(`${BASE_URL}/Customization/${id}`);
      return handleResponse<CustomizationPoint>(response);
    },

    create: async (item: CustomizationPoint): Promise<CustomizationPoint> => {
      const response = await fetch(`${BASE_URL}/Customization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<CustomizationPoint>(response);
    },

    update: async (id: number, item: CustomizationPoint): Promise<CustomizationPoint> => {
      const response = await fetch(`${BASE_URL}/Customization/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<CustomizationPoint>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/Customization/${id}`, {
        method: 'DELETE',
      });
      return handleResponse<void>(response);
    },
  },

  // ==================== FIELD MASTER ====================
  fieldMaster: {
    getAll: async (): Promise<FieldMaster[]> => {
      const response = await fetch(`${BASE_URL}/FieldMaster`);
      return handleResponse<FieldMaster[]>(response);
    },

    getByModuleGroup: async (moduleGroupId: number): Promise<FieldMaster[]> => {
      const response = await fetch(`${BASE_URL}/FieldMaster/group/${moduleGroupId}`);
      return handleResponse<FieldMaster[]>(response);
    },

    getById: async (id: number): Promise<FieldMaster> => {
      const response = await fetch(`${BASE_URL}/FieldMaster/${id}`);
      return handleResponse<FieldMaster>(response);
    },

    create: async (field: FieldMaster): Promise<FieldMaster> => {
      const response = await fetch(`${BASE_URL}/FieldMaster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(field),
      });
      return handleResponse<FieldMaster>(response);
    },

    update: async (id: number, field: FieldMaster): Promise<FieldMaster> => {
      const response = await fetch(`${BASE_URL}/FieldMaster/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(field),
      });
      return handleResponse<FieldMaster>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/FieldMaster/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    },

    getLookupValues: async (type: string): Promise<{ lookupKey: string; lookupValue: string }[]> => {
      const response = await fetch(`${BASE_URL}/FieldMaster/lookup/${type}`);
      return handleResponse<{ lookupKey: string; lookupValue: string }[]>(response);
    },
  },

  // ==================== DYNAMIC MODULE DATA ====================
  moduleData: {
    get: async (projectId: number, moduleGroupId: number): Promise<DynamicModuleData[]> => {
      const response = await fetch(
        `${BASE_URL}/ModuleData?projectId=${projectId}&moduleGroupId=${moduleGroupId}`
      );
      return handleResponse<DynamicModuleData[]>(response);
    },

    getById: async (id: string): Promise<DynamicModuleData> => {
      const response = await fetch(`${BASE_URL}/ModuleData/${id}`);
      return handleResponse<DynamicModuleData>(response);
    },

    create: async (data: DynamicModuleData): Promise<DynamicModuleData> => {
      const response = await fetch(`${BASE_URL}/ModuleData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<DynamicModuleData>(response);
    },

    update: async (id: string, data: DynamicModuleData): Promise<DynamicModuleData> => {
      const response = await fetch(`${BASE_URL}/ModuleData/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<DynamicModuleData>(response);
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${BASE_URL}/ModuleData/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    },
  },

  // ==================== MODULE MASTER ====================
  moduleMaster: {
    getAll: async (): Promise<ModuleMaster[]> => {
      const response = await fetch(`${BASE_URL}/ModuleMaster`);
      return handleResponse<ModuleMaster[]>(response);
    },

    create: async (data: ModuleMaster): Promise<ModuleMaster> => {
      const response = await fetch(`${BASE_URL}/ModuleMaster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<ModuleMaster>(response);
    },

    update: async (id: number, data: ModuleMaster): Promise<ModuleMaster> => {
      const response = await fetch(`${BASE_URL}/ModuleMaster/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // Handle 204 No Content
      if (response && (response as any).status === 204) return data;
      return handleResponse<ModuleMaster>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/ModuleMaster/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    },
  },

  // ==================== PROJECT EMAILS ====================
  emails: {
    getAll: async (): Promise<ProjectEmail[]> => {
      const response = await fetch(`${BASE_URL}/Emails`);
      return handleResponse<ProjectEmail[]>(response);
    },

    getByProject: async (projectId: number): Promise<ProjectEmail[]> => {
      const response = await fetch(`${BASE_URL}/Emails/project/${projectId}`);
      return handleResponse<ProjectEmail[]>(response);
    },

    getById: async (id: number): Promise<ProjectEmail> => {
      const response = await fetch(`${BASE_URL}/Emails/${id}`);
      return handleResponse<ProjectEmail>(response);
    },

    create: async (data: FormData): Promise<ProjectEmail> => {
      const response = await fetch(`${BASE_URL}/Emails`, {
        method: 'POST',
        body: data,
      });
      return handleResponse<ProjectEmail>(response);
    },

    update: async (id: number, data: ProjectEmail): Promise<ProjectEmail> => {
      const response = await fetch(`${BASE_URL}/Emails/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<ProjectEmail>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/Emails/${id}`, {
        method: 'DELETE',
      });
      return handleResponse<void>(response);
    },
  },

  // ==================== WEB TABLES ====================
  webTables: {
    getAll: async (): Promise<WebTable[]> => {
      const response = await fetch(`${BASE_URL}/WebTables`);
      return handleResponse<WebTable[]>(response);
    },

    create: async (data: WebTable): Promise<WebTable> => {
      const response = await fetch(`${BASE_URL}/WebTables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<WebTable>(response);
    },

    update: async (id: number, data: WebTable): Promise<WebTable> => {
      const response = await fetch(`${BASE_URL}/WebTables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<WebTable>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/WebTables/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    },
  },
  // ==================== MANUAL CONFIGURATION ====================
  manualConfigurations: {
    getByProject: async (projectId: number): Promise<ManualConfiguration[]> => {
      const response = await fetch(`${BASE_URL}/ManualConfigurations/project/${projectId}`);
      return handleResponse<ManualConfiguration[]>(response);
    },

    getById: async (id: number): Promise<ManualConfiguration> => {
      const response = await fetch(`${BASE_URL}/ManualConfigurations/${id}`);
      return handleResponse<ManualConfiguration>(response);
    },

    create: async (item: ManualConfiguration): Promise<ManualConfiguration> => {
      const response = await fetch(`${BASE_URL}/ManualConfigurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<ManualConfiguration>(response);
    },

    update: async (id: number, item: ManualConfiguration): Promise<ManualConfiguration> => {
      const response = await fetch(`${BASE_URL}/ManualConfigurations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      // Handle 204 No Content
      if (response && (response as any).status === 204) return item;
      return handleResponse<ManualConfiguration>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/ManualConfigurations/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    },
  },

  // ==================== EXCEL DATA ====================
  excelData: {
    getByProject: async (projectId: number): Promise<ExcelData[]> => {
      const response = await fetch(`${BASE_URL}/ExcelData/project/${projectId}`);
      return handleResponse<ExcelData[]>(response);
    },

    upload: async (formData: FormData): Promise<ExcelData> => {
      const response = await fetch(`${BASE_URL}/ExcelData/upload`, {
        method: 'POST',
        body: formData, // Content-Type handled automatically by browser
      });
      return handleResponse<ExcelData>(response);
    },

    update: async (id: number, formData: FormData): Promise<void> => {
      const response = await fetch(`${BASE_URL}/ExcelData/${id}`, {
        method: 'PUT',
        body: formData,
      });
      return handleResponse<void>(response);
    },

    download: async (id: number): Promise<Blob> => {
      const response = await fetch(`${BASE_URL}/ExcelData/download/${id}`);
      if (!response.ok) throw new Error('Download failed');
      return await response.blob();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/ExcelData/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    },
  },

  // ==================== USERS ====================
  users: {
    getAll: async (): Promise<User[]> => {
      const response = await fetch(`${BASE_URL}/Users`);
      return handleResponse<User[]>(response);
    },

    getById: async (id: number): Promise<User> => {
      const response = await fetch(`${BASE_URL}/Users/${id}`);
      return handleResponse<User>(response);
    },

    create: async (user: User): Promise<User> => {
      const response = await fetch(`${BASE_URL}/Users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      return handleResponse<User>(response);
    },

    update: async (id: number, user: User): Promise<void> => {
      const response = await fetch(`${BASE_URL}/Users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      return handleResponse<void>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/Users/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    },
  },

  // ==================== QUICK WORKS ====================
  quickWorks: {
    getAll: async (): Promise<QuickWork[]> => {
      const response = await fetch(`${BASE_URL}/QuickWorks`);
      return handleResponse<QuickWork[]>(response);
    },

    getById: async (id: number): Promise<QuickWork> => {
      const response = await fetch(`${BASE_URL}/QuickWorks/${id}`);
      return handleResponse<QuickWork>(response);
    },

    create: async (item: Partial<QuickWork>): Promise<QuickWork> => {
      const response = await fetch(`${BASE_URL}/QuickWorks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<QuickWork>(response);
    },

    update: async (id: number, item: Partial<QuickWork>): Promise<QuickWork> => {
      const response = await fetch(`${BASE_URL}/QuickWorks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return handleResponse<QuickWork>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/QuickWorks/${id}`, {
        method: 'DELETE'
      });
      return handleResponse<void>(response);
    },
  },
};

// Legacy API for backward compatibility
export const legacyApi = {
  getFields: api.fieldMaster.getByModuleGroup,
  saveField: api.fieldMaster.create,
  deleteField: api.fieldMaster.delete,
  getProjects: api.projects.getAll,
  saveProject: api.projects.create,
  getModuleData: api.moduleData.get,
  saveModuleData: api.moduleData.create,
  deleteModuleData: api.moduleData.delete,
};
