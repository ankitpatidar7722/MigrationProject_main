
import {
  Project,
  DataTransferCheck,
  VerificationRecord,
  MigrationIssue,
  CustomizationPoint
} from '../types';
import { api } from './api';

/**
 * Storage Service - Now connects to SQL Server via Backend API
 * Previously used localStorage, now uses real database
 */

export const storageService = {
  // ==================== PROJECTS ====================
  getProjects: async (): Promise<Project[]> => {
    try {
      return await api.projects.getAll();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  saveProject: async (project: Project): Promise<void> => {
    try {
      // Logic correction: check if ID is present and check existence
      if (project.projectId && await projectExists(project.projectId)) {
        await api.projects.update(project.projectId, project);
      } else {
        await api.projects.create(project);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  },

  deleteProject: async (id: number): Promise<void> => {
    try {
      await api.projects.delete(id);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // ==================== DATA TRANSFER CHECKS ====================
  getTransferChecks: async (projectId: number): Promise<DataTransferCheck[]> => {
    try {
      return await api.dataTransfer.getByProject(projectId);
    } catch (error) {
      console.error('Error fetching transfer checks:', error);
      return [];
    }
  },

  getAllTransferChecks: async (): Promise<DataTransferCheck[]> => {
    try {
      return await api.dataTransfer.getAll();
    } catch (error) {
      console.error('Error fetching all transfer checks:', error);
      return [];
    }
  },

  saveTransferCheck: async (check: DataTransferCheck): Promise<void> => {
    try {
      if (check.transferId && await transferCheckExists(check.transferId)) {
        await api.dataTransfer.update(check.transferId, check);
      } else {
        await api.dataTransfer.create(check);
      }
    } catch (error) {
      console.error('Error saving transfer check:', error);
      throw error;
    }
  },

  deleteTransferCheck: async (id: any): Promise<void> => {
    try {
      await api.dataTransfer.delete(id);
    } catch (error) {
      console.error('Error deleting transfer check:', error);
      throw error;
    }
  },

  // ==================== VERIFICATIONS ====================
  getVerifications: async (projectId: number): Promise<VerificationRecord[]> => {
    try {
      return await api.verification.getByProject(projectId);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      return [];
    }
  },

  saveVerification: async (rec: VerificationRecord): Promise<void> => {
    try {
      if (rec.verificationId && await verificationExists(rec.verificationId)) {
        await api.verification.update(rec.verificationId, rec);
      } else {
        await api.verification.create(rec);
      }
    } catch (error) {
      console.error('Error saving verification:', error);
      throw error;
    }
  },

  // ==================== ISSUES ====================
  getIssues: async (projectId: number): Promise<MigrationIssue[]> => {
    try {
      return await api.issues.getByProject(projectId);
    } catch (error) {
      console.error('Error fetching issues:', error);
      return [];
    }
  },

  getAllIssues: async (): Promise<MigrationIssue[]> => {
    try {
      return await api.issues.getAll();
    } catch (error) {
      console.error('Error fetching all issues:', error);
      return [];
    }
  },

  saveIssue: async (issue: MigrationIssue): Promise<void> => {
    try {
      if (issue.issueId && await issueExists(issue.issueId)) {
        await api.issues.update(issue.issueId, issue);
      } else {
        await api.issues.create(issue);
      }
    } catch (error) {
      console.error('Error saving issue:', error);
      throw error;
    }
  },

  // ==================== CUSTOMIZATIONS ====================
  getCustomizations: async (projectId: number): Promise<CustomizationPoint[]> => {
    try {
      return await api.customization.getByProject(projectId);
    } catch (error) {
      console.error('Error fetching customizations:', error);
      return [];
    }
  },

  saveCustomization: async (point: CustomizationPoint): Promise<void> => {
    try {
      if (point.customizationId && await customizationExists(point.customizationId)) {
        await api.customization.update(point.customizationId, point);
      } else {
        await api.customization.create(point);
      }
    } catch (error) {
      console.error('Error saving customization:', error);
      throw error;
    }
  }
};

// Helper functions to check if entities exist
async function projectExists(id: number): Promise<boolean> {
  try {
    await api.projects.getById(id);
    return true;
  } catch {
    return false;
  }
}

async function transferCheckExists(id: any): Promise<boolean> {
  try {
    await api.dataTransfer.getById(id);
    return true;
  } catch {
    return false;
  }
}

async function verificationExists(id: any): Promise<boolean> {
  try {
    await api.verification.getById(id);
    return true;
  } catch {
    return false;
  }
}

async function issueExists(id: any): Promise<boolean> {
  try {
    await api.issues.getById(id);
    return true;
  } catch {
    return false;
  }
}

async function customizationExists(id: any): Promise<boolean> {
  try {
    await api.customization.getById(id);
    return true;
  } catch {
    return false;
  }
}
