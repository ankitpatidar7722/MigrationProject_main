
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import {
  Database,
  Server,
  ShieldCheck,
  AlertTriangle,
  Settings2,
  ChevronRight,
  LayoutGrid,
  TrendingUp,
  FileText,
  Loader2,
  Edit2,
  Check,
  X,
  Copy,
  ArrowLeft,
  Wrench,
  FileSpreadsheet
} from 'lucide-react';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Project, DataTransferCheck, VerificationRecord, MigrationIssue, CustomizationPoint, ManualConfiguration } from '../types';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';

const ProjectDetail: React.FC = () => {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  // Parse projectId to number
  const projectId = projectIdStr ? parseInt(projectIdStr, 10) : 0;
  const { hasPermission } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [transfers, setTransfers] = useState<DataTransferCheck[]>([]);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [issues, setIssues] = useState<MigrationIssue[]>([]);
  const [customizations, setCustomizations] = useState<CustomizationPoint[]>([]);
  const [manualConfigs, setManualConfigs] = useState<ManualConfiguration[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Clone state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [targetProject, setTargetProject] = useState<string>('');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // 1. Load Projects first (Critical)
        const projectsData = await storageService.getProjects();
        const foundProject = projectsData.find(p => p.projectId === projectId);

        if (!foundProject) {
          setProject(null);
          setLoading(false);
          return;
        }

        setProject(foundProject);

        // 2. Load other modules (Parallel)
        const [transfersData, verificationsData, issuesData, customizationsData] = await Promise.all([
          storageService.getTransferChecks(projectId),
          storageService.getVerifications(projectId),
          storageService.getIssues(projectId),
          storageService.getCustomizations(projectId)
        ]);

        setTransfers(transfersData);
        setVerifications(verificationsData);
        setIssues(issuesData);
        setCustomizations(customizationsData);

        // 3. Load Manual Configs (Non-Critical - Try/Catch)
        try {
          // Load Manual Configs & Excel Data (Non-Critical)
          const [manualConfigsData, excelDataList] = await Promise.all([
            api.manualConfigurations.getByProject(projectId),
            project.migrationType === 'By Excel' ? api.excelData.getByProject(projectId) : Promise.resolve([])
          ]);
          setManualConfigs(manualConfigsData || []);
          setExcelData(excelDataList || []);
        } catch (configErr) {
          console.error('Failed to load aux configurations:', configErr);
          setManualConfigs([]);
        }

      } catch (err) {
        console.error('Error loading project data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  const handleEditName = () => {
    if (project) {
      setTempName(project.clientName);
      setIsEditingName(true);
    }
  };

  const handleCancelName = () => {
    setIsEditingName(false);
    setTempName('');
  };

  const handleSaveName = async () => {
    if (!project || !tempName.trim()) return;

    setSavingName(true);
    try {
      const updatedProject = { ...project, clientName: tempName };
      await storageService.saveProject(updatedProject);
      setProject(updatedProject);
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update project name:', error);
      alert('Failed to update project name');
    } finally {
      setSavingName(false);
    }
  };

  const modules = [
    {
      id: 'transfer',
      title: 'Data Transfer Checks',
      desc: 'Plan and track table migration status',
      icon: <Database size={24} />,
      count: transfers.length,
      completed: transfers.filter(t => t.status === 'Completed').length,
      color: 'blue',
      path: 'transfer',
      params: 'Data Transfer Checks'
    },
    {
      id: 'verification',
      title: 'Verification List',
      desc: 'Post-migration field & logic verification',
      icon: <ShieldCheck size={24} />,
      count: verifications.length,
      completed: verifications.filter(v => v.status === 'Correct').length,
      color: 'emerald',
      path: 'verification',
      params: 'Verification List'
    },
    {
      id: 'issues',
      title: 'Migration Issues',
      desc: 'Log and track bugs or blockages',
      icon: <AlertTriangle size={24} />,
      count: issues.length,
      completed: issues.filter(i => i.status === 'Closed').length,
      color: 'red',
      path: 'issues',
      params: 'Migration Issues'
    },
    {
      id: 'customization',
      title: 'Customization Points',
      desc: 'Client-specific post-migration requirements',
      icon: <Settings2 size={24} />,
      count: customizations.length,
      completed: customizations.filter(c => c.status === 'Completed').length,
      color: 'amber',
      path: 'customization',
      params: 'Customization Points'
    },
    {
      id: 'manual-config',
      title: 'Manual Configuration',
      desc: 'Log manual maintenance & config work',
      icon: <Wrench size={24} />,
      count: manualConfigs.length,
      completed: 0, // No status for manual config yet, or treat all as 'completed' if we want progress
      color: 'purple',
      path: 'manual-config',
      params: 'Manual Configuration'
    }
  ];

  if (project?.migrationType === 'By Excel') {
    modules.push({
      id: 'excel-data',
      title: 'Excel Data',
      desc: 'Upload and manage Excel files',
      icon: <FileSpreadsheet size={24} />,
      count: excelData.length,
      completed: excelData.length, // Treat uploaded as completed for progress
      color: 'green',
      path: 'excel-data',
      params: 'Excel Data'
    });
  }

  const visibleModules = modules.filter(m => hasPermission(m.params as any, 'View'));

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading Project Details..." />;
  }

  if (!project) return <div className="p-8 text-center">Project not found</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Projects</span>
      </Link>
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-3xl shadow-xl shadow-blue-500/20">
            {project.clientName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="text-3xl font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={handleCancelName}
                    disabled={savingName}
                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                  <h1 className="text-3xl font-bold">{project.clientName}</h1>
                  {hasPermission('Project', 'Edit') && (
                    <button
                      onClick={handleEditName}
                      className="p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit project name"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
              )}
              {!isEditingName && (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-800/30">Active</span>
              )}
            </div>
            <p className="text-slate-500 dark:text-zinc-400 mt-1 max-w-2xl">{project.description}</p>

            {/* Connection Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Server size={14} /> Desktop Environment
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">Server Name</div>
                    <div className="font-medium text-slate-700 dark:text-zinc-200" title={project.serverDesktop?.serverName}>{project.serverDesktop?.serverName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">Database</div>
                    <div className="font-medium text-blue-600" title={project.databaseDesktop?.databaseName}>{project.databaseDesktop?.databaseName || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="md:border-l border-slate-200 dark:border-zinc-700 md:pl-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Database size={14} /> Web Environment
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">Server Name</div>
                    <div className="font-medium text-slate-700 dark:text-zinc-200" title={project.serverWeb?.serverName}>{project.serverWeb?.serverName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">Database</div>
                    <div className="font-medium text-emerald-600" title={project.databaseWeb?.databaseName}>{project.databaseWeb?.databaseName || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (project && customizations && issues) {
                  import('../services/ReportGenerator').then(({ generateProjectReport }) => {
                    generateProjectReport({ project, customizationPoints: customizations, issues });
                  });
                }
              }}
              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Export PDF Report"
            >
              <FileText size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" title="View Statistics">
              <TrendingUp size={20} />
            </button>
            {hasPermission('Project', 'Create') && (
              <button
                onClick={async () => {
                  try {
                    const all = await storageService.getProjects();
                    setAllProjects(all.filter(p => p.projectId !== projectId));
                    setShowCloneModal(true);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                <Copy size={16} />
                Clone Data to...
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleModules.map(mod => (
          <Link
            key={mod.id}
            to={`/projects/${projectId}/${mod.path}`}
            className="group block bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-blue-500 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${mod.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                mod.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                  mod.color === 'red' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                }`}>
                {mod.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">{mod.title}</h3>
                <p className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5 line-clamp-1">{mod.desc}</p>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                    <span>Progress</span>
                    <span>{mod.count > 0 ? Math.round((mod.completed / mod.count) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${mod.color === 'blue' ? 'bg-blue-500' :
                        mod.color === 'emerald' ? 'bg-emerald-500' :
                          mod.color === 'red' ? 'bg-red-500' :
                            'bg-amber-500'
                        }`}
                      style={{ width: `${mod.count > 0 ? (mod.completed / mod.count) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                      {mod.completed} of {mod.count} records {mod.id === 'issues' ? 'resolved' : 'completed'}
                    </span>
                    <div className="text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Open Module
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Clone Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">Clone Project Data</h2>
            <p className="text-slate-500 dark:text-zinc-400 mb-6 text-sm">
              Copy all data (Transfer Checks, Issues, Consultations, Verifications) from <span className="font-bold text-slate-900 dark:text-white">{project.clientName}</span> to another project.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Target Project</label>
              <select
                className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={targetProject}
                onChange={(e) => setTargetProject(e.target.value)}
              >
                <option value="" disabled hidden>Select Target Project...</option>
                {allProjects.map(p => (
                  <option key={p.projectId} value={p.projectId}>{p.clientName}</option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-amber-50 text-amber-800 rounded-xl mb-6 text-xs flex gap-3">
              <AlertTriangle className="shrink-0" size={16} />
              <p>Warning: This will add data to the target project. It does not verify for existing duplicates automatically.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCloneModal(false); setTargetProject(''); }}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                disabled={!targetProject || cloning}
                onClick={async () => {
                  setCloning(true);
                  try {
                    await api.projects.clone(projectId, parseInt(targetProject));
                    alert('Project data cloned successfully!');
                    setShowCloneModal(false);
                    setTargetProject('');
                  } catch (err) {
                    console.error('Clone failed:', err);
                    alert('Failed to clone data. Please try again.');
                  } finally {
                    setCloning(false);
                  }
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cloning ? 'Cloning...' : 'Clone Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
