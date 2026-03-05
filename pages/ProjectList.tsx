
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Project, ServerData, DatabaseDetail } from '../types';
import { Plus, Search, ExternalLink, Calendar, Trash2, Loader2, Edit3, X, GripVertical, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRefresh } from '../services/RefreshContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SearchableSelect } from '../components/SearchableSelect';
import { useAuth } from '../services/AuthContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface SortableProjectCardProps {
  project: Project;
  stats: any;
  onEdit?: (project: Project) => void;
  onDelete?: (id: number) => void;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({ project, stats, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: project.projectId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            {/* Drag Handle - Only show if draggable (which we'll tie to onEdit presence for now or pass explicit prop) */}
            {onEdit && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-move text-slate-300 hover:text-slate-500 dark:text-zinc-600 dark:hover:text-zinc-400"
              >
                <GripVertical size={20} />
              </div>
            )}
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
              {project.clientName[0]}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(project)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
                title="Edit Project"
              >
                <Edit3 size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(project.projectId)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                title="Delete Project"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        <h3 className="text-lg font-bold truncate">{project.clientName}</h3>
        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1 h-10 line-clamp-2">
          {project.description}
        </p>

        {/* Progress Stats */}
        <div className="mt-4 space-y-3">
          {/* Data Transfer Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-zinc-400">Data Transfer</span>
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                {stats?.transferProgress || 0}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${stats?.transferProgress || 0}%` }}
              />
            </div>
          </div>

          {/* Verification Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-zinc-400">Verification</span>
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                {stats?.verificationProgress || 0}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats?.verificationProgress || 0}%` }}
              />
            </div>
          </div>
        </div>



        <div className="mt-6 grid grid-cols-3 gap-2 text-[10px] font-medium text-slate-500 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-800 pt-4">
          <div>
            <p className="uppercase tracking-wider text-[9px] mb-0.5 opacity-70">Start</p>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              {project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </div>
          </div>
          <div>
            <p className="uppercase tracking-wider text-[9px] mb-0.5 opacity-70">Target</p>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              {project.targetCompletionDate ? new Date(project.targetCompletionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </div>
          </div>
          <div>
            <p className="uppercase tracking-wider text-[9px] mb-0.5 opacity-70">Live</p>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Calendar size={12} />
              {project.liveDate ? new Date(project.liveDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Implementation Coordinator</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            {project.implementationCoordinator || 'Unassigned'}
          </span>
          {project.coordinatorEmail && (
            <span className="text-[10px] text-slate-500">{project.coordinatorEmail}</span>
          )}
        </div>
        <Link
          to={`/projects/${project.projectId}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Open Project
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
};

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    clientName: '',
    description: '',
    startDate: '',
    targetCompletionDate: '',
    liveDate: '',
    implementationCoordinator: '',
    coordinatorEmail: ''
  });
  const [stats, setStats] = useState<Record<number, any>>({});
  const [servers, setServers] = useState<ServerData[]>([]);
  const [databases, setDatabases] = useState<DatabaseDetail[]>([]);
  const { hasPermission } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /* import useRefresh first */

  const { registerRefresh } = useRefresh();

  const loadProjects = async () => {
    try {
      const data = await api.projects.getAll();
      setProjects(data);

      const [serversData, dbsData] = await Promise.all([
        api.serverData.getAll(),
        api.databaseDetails.getAll()
      ]);
      setServers(serversData);
      setDatabases(dbsData);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    registerRefresh(loadProjects);
    return () => registerRefresh(() => { });
  }, [registerRefresh]);

  useEffect(() => {
    if (projects.length > 0) {
      const loadStats = async () => { /*...*/ };
      loadStats();
    }
  }, [projects]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setProjects((items) => {
        const oldIndex = items.findIndex((i) => i.projectId === active.id);
        const newIndex = items.findIndex((i) => i.projectId === over?.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Optimistic update done, now sync with backend
        // Update displayOrder property for all items
        const updatedProjects = newOrder.map((p: Project, index) => ({
          ...p,
          displayOrder: index + 1
        }));

        // Fire and forget (or handle error if necessary)
        api.projects.reorder(updatedProjects).catch(err => {
          console.error('Failed to save order', err);
          // Could revert here if strict consistency is needed
        });

        return updatedProjects;
      });
    }
  };

  const handleSave = async () => {
    if (!newProject.clientName) {
      alert('Please enter a client name');
      return;
    }
    setSaving(true);
    try {


      const projectData: any = {
        projectId: newProject.projectId,
        clientName: newProject.clientName,
        description: newProject.description || '',
        migrationType: newProject.migrationType || 'By Tool',
        status: newProject.status || 'Active',
        isActive: true,
        startDate: newProject.startDate ? new Date(newProject.startDate).toISOString() : null,
        targetCompletionDate: newProject.targetCompletionDate ? new Date(newProject.targetCompletionDate).toISOString() : null,
        liveDate: newProject.liveDate ? new Date(newProject.liveDate).toISOString() : null,
        implementationCoordinator: newProject.implementationCoordinator || null,
        coordinatorEmail: newProject.coordinatorEmail || null,
        displayOrder: newProject.projectId ? undefined : undefined, // Backend handles order (Min-1)
        serverIdDesktop: newProject.serverIdDesktop || null,
        databaseIdDesktop: newProject.databaseIdDesktop || null,
        serverIdWeb: newProject.serverIdWeb || null,
        databaseIdWeb: newProject.databaseIdWeb || null
      };

      if (newProject.projectId) {
        await api.projects.update(newProject.projectId, projectData);
      } else {
        delete projectData.projectId; // Ensure no ID for create
        await api.projects.create(projectData);
      }

      await loadProjects();
      setShowModal(false);
      setNewProject({
        clientName: '',
        description: '',
        startDate: '',
        targetCompletionDate: '',
        liveDate: '',
        implementationCoordinator: '',
        coordinatorEmail: ''
      });
    } catch (err: any) {
      console.error('Error saving project:', err);
      alert(`Failed to save project: ${err.message || err.toString()}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this project and all its data?')) {
      try {
        await api.projects.delete(id);
        await loadProjects();
      } catch (err) {
        console.error('Error deleting project:', err);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleEdit = (project: Project) => {
    setNewProject({
      projectId: project.projectId,
      clientName: project.clientName,
      description: project.description,
      status: project.status,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      targetCompletionDate: project.targetCompletionDate ? project.targetCompletionDate.split('T')[0] : '',
      liveDate: project.liveDate ? project.liveDate.split('T')[0] : '',
      implementationCoordinator: project.implementationCoordinator || '',
      coordinatorEmail: project.coordinatorEmail || '',
      serverIdDesktop: project.serverIdDesktop,
      databaseIdDesktop: project.databaseIdDesktop,
      serverIdWeb: project.serverIdWeb,
      databaseIdWeb: project.databaseIdWeb
    });
    setShowModal(true);
  };

  const filtered = projects.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading Projects..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients & Projects</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Manage multiple migration environments.</p>
        </div>
        {hasPermission('Projects', 'Create') && (
          <button
            onClick={() => {
              setNewProject({
                clientName: '',
                description: '',
                startDate: '',
                targetCompletionDate: '',
                liveDate: '',
                implementationCoordinator: '',
                coordinatorEmail: ''
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm"
          >
            <Plus size={18} />
            New Client Project
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by client or project details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SortableContext
            items={filtered.map(p => p.projectId)}
            strategy={rectSortingStrategy}
          >
            {filtered.map(project => (
              <SortableProjectCard
                key={project.projectId}
                project={project}
                stats={stats[project.projectId]}
                onEdit={hasPermission('Projects', 'Edit') ? handleEdit : undefined}
                onDelete={hasPermission('Projects', 'Delete') ? handleDelete : undefined}
              />
            ))}
          </SortableContext>
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No projects found</h3>
              <p className="text-slate-500 dark:text-zinc-400">Try adjusting your search or create a new project.</p>
            </div>
          )}
        </div>
      </DndContext>

      {/* Create/Edit Project Modal - Same as before */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">{newProject.projectId ? 'Edit Project' : 'New Client Project'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Client Name</label>
                <input
                  type="text"
                  value={newProject.clientName}
                  onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Acme Industries"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Migration Type</label>
                <select
                  value={newProject.migrationType || 'By Tool'}
                  onChange={(e) => setNewProject({ ...newProject, migrationType: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="By Tool">By Tool</option>
                  <option value="By Excel">By Excel</option>
                </select>
              </div>
              {/* ... other fields ... */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Project Description</label>
                <textarea
                  value={newProject.description || ''}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Summarize the migration scope..."
                />
              </div>

              {/* Connection Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Desktop Environment</div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Desktop Server</label>
                  <SearchableSelect
                    value={newProject.serverIdDesktop || ''}
                    onChange={(val) => setNewProject({
                      ...newProject,
                      serverIdDesktop: Number(val),
                      databaseIdDesktop: undefined // Reset DB on server change
                    })}
                    options={servers.map(s => ({ label: s.serverName, value: s.serverId }))}
                    placeholder="Select Server"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Desktop Database</label>
                  <SearchableSelect
                    value={newProject.databaseIdDesktop || ''}
                    onChange={(val) => setNewProject({ ...newProject, databaseIdDesktop: Number(val) })}
                    disabled={!newProject.serverIdDesktop}
                    options={databases
                      .filter(d => d.serverId === newProject.serverIdDesktop && d.databaseCategory === 'DT')
                      .map(d => ({ label: d.databaseName, value: d.databaseId }))}
                    placeholder="Select Database"
                    className="w-full"
                  />
                </div>

                <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Web Environment</div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Web Server</label>
                  <SearchableSelect
                    value={newProject.serverIdWeb || ''}
                    onChange={(val) => setNewProject({
                      ...newProject,
                      serverIdWeb: Number(val),
                      databaseIdWeb: undefined // Reset DB on server change
                    })}
                    options={servers.map(s => ({ label: s.serverName, value: s.serverId }))}
                    placeholder="Select Server"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Web Database</label>
                  <SearchableSelect
                    value={newProject.databaseIdWeb || ''}
                    onChange={(val) => setNewProject({ ...newProject, databaseIdWeb: Number(val) })}
                    disabled={!newProject.serverIdWeb}
                    options={databases
                      .filter(d => d.serverId === newProject.serverIdWeb && d.databaseCategory === 'WT')
                      .map(d => ({ label: d.databaseName, value: d.databaseId }))}
                    placeholder="Select Database"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={newProject.startDate || ''}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Target End</label>
                  <input
                    type="date"
                    value={newProject.targetCompletionDate || ''}
                    onChange={(e) => setNewProject({ ...newProject, targetCompletionDate: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Live Date</label>
                  <input
                    type="date"
                    value={newProject.liveDate || ''}
                    onChange={(e) => setNewProject({ ...newProject, liveDate: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Imp. Coordinator</label>
                  <input
                    type="text"
                    value={newProject.implementationCoordinator || ''}
                    onChange={(e) => setNewProject({ ...newProject, implementationCoordinator: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Coordinator Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Coordinator Email</label>
                  <input
                    type="email"
                    value={newProject.coordinatorEmail || ''}
                    onChange={(e) => setNewProject({ ...newProject, coordinatorEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-zinc-800/50 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {newProject.projectId ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};



export default ProjectList;
