
import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  ChevronRight,
  Plus,
  Loader2
} from 'lucide-react';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { storageService } from '../services/storageService';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Project, DataTransferCheck, MigrationIssue } from '../types';
import { useLanguage } from '../services/LanguageContext';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTransfers, setAllTransfers] = useState<DataTransferCheck[]>([]);
  const [allIssues, setAllIssues] = useState<MigrationIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectStats, setProjectStats] = useState<Record<number, any>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ultra-optimized: 1 single API call returns everything (cached 60s on server)
        const data = await api.projects.getDashboardAll();

        setProjects(data.projects);
        setAllTransfers(data.transfers);
        setAllIssues(data.issues);
        setProjectStats(data.stats);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please check your backend connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    let completedCount = 0;
    let pendingCount = 0;

    projects.forEach(p => {
      const s = projectStats[p.projectId];
      if (s) {
        const isCompleted = s.transferProgress === 100 && s.verificationProgress === 100;
        if (isCompleted) {
          completedCount++;
        } else {
          pendingCount++;
        }
      } else {
        // Default to pending if stats missing
        pendingCount++;
      }
    });

    return [
      { label: 'Total Projects', value: projects.length, icon: <Users size={24} />, color: 'blue' },
      { label: 'Completed Migrations', value: completedCount, icon: <CheckCircle2 size={24} />, color: 'green' },
      { label: 'Pending Transfers', value: pendingCount, icon: <Clock size={24} />, color: 'orange' },
      // Open Issues card removed as requested
    ];
  }, [projects, projectStats]);

  const chartData = projects.map(p => {
    const pTransfers = allTransfers.filter(t => t.projectId === p.projectId);
    const pIssues = allIssues.filter(i => i.projectId === p.projectId);
    return {
      name: p.clientName,
      completed: pTransfers.filter(t => t.status === 'Completed').length,
      pending: pTransfers.filter(t => t.status !== 'Completed').length,
      issues: pIssues.length
    };
  });

  if (loading) {
    return <LoadingOverlay isVisible={true} message={t('loading_dashboard')} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">{t('connection_error')}</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('dashboard_overview')}</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">{t('dashboard_subtitle')}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
              stat.color === 'green' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                stat.color === 'orange' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                  'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
              {stat.icon}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{t(stat.label.toLowerCase().replace(/ /g, '_'))}</p>
            <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Overview Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-[0_0_15px_rgba(168,85,247,0.15)] dark:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-shadow hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]">
          <h2 className="text-lg font-bold mb-6 text-center">{t('project_status_distribution')}</h2>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: projects.filter(p => p.status === 'Active').length },
                    { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length },
                    { name: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length }
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${t(name.toLowerCase().replace(/ /g, '_'))} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell key="cell-active" fill="#8b5cf6" />
                  <Cell key="cell-completed" fill="#d946ef" />
                  <Cell key="cell-hold" fill="#c4b5fd" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ fontSize: '12px', color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 pb-2 border-t border-slate-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-violet-500"></div>
              <span className="text-xs text-slate-500 font-medium">{t('active')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-fuchsia-500"></div>
              <span className="text-xs text-slate-500 font-medium">{t('completed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-violet-300"></div>
              <span className="text-xs text-slate-500 font-medium">{t('on_hold')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-[0_0_15px_rgba(236,72,153,0.15)] dark:shadow-[0_0_15px_rgba(236,72,153,0.1)] transition-shadow hover:shadow-[0_0_20px_rgba(236,72,153,0.25)]">
          <h2 className="text-lg font-bold mb-6 text-center">{t('overall_migration_progress')}</h2>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed Checks', value: allTransfers.filter(t => t.status === 'Completed').length },
                    { name: 'Pending Checks', value: allTransfers.filter(t => t.status !== 'Completed').length }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  <Cell key="cell-completed" fill="#d946ef" />
                  <Cell key="cell-pending" fill="#c4b5fd" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ fontSize: '12px', color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 pb-2 border-t border-slate-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-fuchsia-500"></div>
              <span className="text-xs text-slate-500 font-medium">{t('completed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-violet-300"></div>
              <span className="text-xs text-slate-500 font-medium">{t('pending_checks')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold">Migration Progress by Client</h2>
            <select className="bg-slate-50 dark:bg-zinc-800 border-none text-xs rounded-lg px-3 py-1.5 outline-none">
              <option>Last 30 Days</option>
              <option>All Time</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ fontSize: '12px', color: '#0f172a' }}
                />
                <Bar dataKey="completed" fill="#d946ef" radius={[4, 4, 0, 0]} name="Completed Checks" />
                <Bar dataKey="pending" fill="#c4b5fd" radius={[4, 4, 0, 0]} name="Pending Checks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Projects */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold mb-6">Recent Projects</h2>
          <div className="space-y-5">
            {projects.slice(0, 5).map(project => (
              <Link
                key={project.projectId}
                to={`/projects/${project.projectId}`}
                className="flex items-center group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 font-bold text-sm mr-4 shrink-0">
                  {project.clientName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate group-hover:text-blue-600 transition-colors">{project.clientName}</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{project.description}</p>
                </div>
                <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" size={16} />
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">No active projects yet.</p>
              </div>
            )}
          </div>
          {
            projects.length > 0 && (
              <Link to="/projects" className="mt-8 block text-center text-sm font-semibold text-blue-600 hover:text-blue-700">
                View All Projects
              </Link>
            )
          }
        </div >
      </div >
    </div >
  );
};

const Users = ({ size }: { size: number }) => <UsersIcon size={size} />;
const UsersIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

export default Dashboard;
