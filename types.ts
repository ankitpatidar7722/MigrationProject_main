

export type DataType = 'nvarchar' | 'text' | 'int' | 'bit' | 'date' | 'datetime' | 'decimal' | 'float' | 'bigint' | 'varchar' | 'dropdown' | 'select' | 'checkbox' | 'number' | 'email' | 'textarea'; // SQL native types + legacy frontend types

/**
 * Maps directly to FieldMaster table in MS SQL Server
 */
export interface FieldMaster {
  fieldId: number;         // Primary Key
  fieldName: string;       // Actual column name
  fieldLabel: string;
  fieldDescription?: string;
  moduleGroupId: number;   // 1001, 1002, etc.
  dataType: DataType;      // DataTypes column in SQL
  defaultValue?: string;
  selectQueryDb?: string;   // SQL Query for dropdown population
  validationRegex?: string;
  placeholderText?: string;
  helpText?: string;
  isRequired: boolean;
  isUnique?: boolean;
  isActive?: boolean;
  isDisplay?: boolean;
  displayOrder: number;
  maxLength?: number;
}

export interface Project {
  projectId: number;
  clientName: string;
  clientCode?: string;
  description: string;
  projectType?: string;
  status: string;
  startDate?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  liveDate?: string;
  projectManager?: string;
  technicalLead?: string;
  budget?: number;
  implementationCoordinator?: string;
  coordinatorEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  displayOrder?: number;
  serverIdDesktop?: number;
  databaseIdDesktop?: number;
  serverIdWeb?: number;
  databaseIdWeb?: number;
  serverDesktop?: ServerData;
  databaseDesktop?: DatabaseDetail;
  serverWeb?: ServerData;
  databaseWeb?: DatabaseDetail;
}

export interface ModuleGroup {
  id: number;
  name: string;
  description: string;
}

/**
 * Dynamically rendered module data
 */
export interface DynamicModuleData {
  recordId: string;
  projectId: number;
  moduleGroupId: number;
  jsonData: string; // JSON String from backend
  status: string;
  isCompleted: boolean;
  createdAt?: string;
}

export interface DashboardStats {
  totalModules: number;
  completedMigrations: number;
  pendingMigrations: number;
  totalIssues: number;
}

// Added missing module-specific interfaces
export interface DataTransferCheck {
  transferId?: number;  // Changed from string to number to match backend long
  projectId: number;
  moduleName: string;
  subModuleName: string;
  condition?: string;
  tableNameDesktop: string;
  tableNameWeb: string;
  recordCountDesktop?: number;
  recordCountWeb?: number;
  matchPercentage?: number;
  status: Status;
  isCompleted: boolean;
  migratedDate?: string;
  verifiedBy?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerificationRecord {
  verificationId?: number; // Changed from string to number
  projectId: number;
  moduleName: string;
  subModuleName: string;
  fieldName: string;
  tableNameDesktop?: string;
  tableNameWeb?: string;
  description: string;
  sqlQuery: string;
  expectedResult: string;
  actualResult: string;
  status: Status;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MigrationIssue {
  issueId: string;
  issueNumber: string;
  projectId: number;
  title: string;
  moduleName: string;
  subModuleName: string;
  description: string;
  rootCause: string;
  status: IssueStatus;
  remarks: string;
  reportedDate: string;
  resolvedDate?: string;
  priority: Priority;
}

export interface CustomizationPoint {
  customizationId: number;  // Changed from string to match backend bigint
  requirementId: string;
  projectId: number;
  moduleName: string;
  subModuleName: string;
  title: string;
  description: string;
  type: CustomizationType;
  status: CustomizationStatus;
  isBillable: boolean;
  notes: string;
}

// Legacy types preserved for compatibility
export type Status = 'Not Started' | 'Pending' | 'Completed' | 'No Data';
export type VerificationStatus = 'Pending' | 'Correct' | 'Incorrect' | 'Re-verify';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type CustomizationType = 'UI' | 'Report' | 'Database' | 'Workflow' | 'Other';
export type CustomizationStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Dropped';

export interface ModuleMaster {
  moduleId: number;
  subModuleName: string;
  moduleName: string;
  groupIndex?: number;
}


export type EmailCategory = 'Approval' | 'Clarification' | 'Requirement' | 'General' | 'Issue' | 'Completion' | 'Rejection' | 'Follow-up';

export interface ProjectEmail {
  emailId: number;
  projectId: number;
  subject: string;
  sender: string;
  receivers: string;
  emailDate: string;
  bodyContent: string;
  category: EmailCategory;
  attachmentPath?: string;
  relatedModule?: string;
  createdAt?: string;
}

export interface User {
  userId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  token?: string;
  permissions?: UserPermission[];
  isActive?: boolean;
}

export interface UserPermission {
  id: number;
  userId: number;
  moduleName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canSave: boolean;
  canDelete: boolean;
}

export const AppModules = [
  'Projects',
  'Data Transfer Checks',
  'Verification List',
  'Customization Points',
  'Migration Issues',
  'Manual Configuration',
  'Excel Data',
  'Email Documentation',
  'Fields',
  'Module Master',
  'Tables',
  'Database',
  'Clone Project',
  'User'
] as const;

export type ModuleName = typeof AppModules[number];

export interface LoginRequest {
  username: string;
  password: string;
}

export interface WebTable {
  webTableId: number;
  tableName: string;
  desktopTableName?: string;
  moduleName?: string;
  groupIndex?: number;
  description?: string;
  createdAt?: string;
}

export interface ServerData {
  serverId: number;
  serverName: string;
  hostName: string;
  serverIndex: string;
}

export interface DatabaseDetail {
  databaseId: number;
  databaseName: string;
  serverId: number;
  serverIndex: string;
  clientName: string;
  databaseCategory?: string;
  server?: ServerData;
}



export interface ManualConfiguration {
  id: number;
  projectId: number;
  moduleName: string;
  subModuleName: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  migrationType?: 'By Excel' | 'By Tool';
}

export interface ExcelData {
  id: number;
  projectId: number;
  moduleName: string;
  subModuleName: string;
  description: string;
  filePath: string;
  fileName: string;
  uploadedBy?: number;
  uploadedAt: string;
}

export interface QuickWork {
  id: number;
  moduleName: string;
  subModuleName: string;
  tableName: string;
  description: string;
  sqlQuery: string;
  createdAt?: string;
  updatedAt?: string;
}
