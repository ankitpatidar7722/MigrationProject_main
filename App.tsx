import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Database,
  Settings,
  Search,
  Moon,
  Sun,
  Plus,
  LogOut,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Cog,
  Calculator,
  FileText,
  ShoppingBag,
  Folder,
  Mail,
  Table,
  Server,
  Shield,
  Code,
  Menu,
  X
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import QuickWorkPage from './pages/QuickWork';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import DynamicModulePage from './pages/DynamicModulePage';
import ModuleMasterManager from './pages/ModuleMasterManager';
import WebTableManager from './pages/WebTableManager';
import FieldManager from './pages/FieldManager';
import DatabaseManager from './pages/DatabaseManager';
import Login from './pages/Login';
import TransferChecks from './pages/TransferChecks';
import VerificationList from './pages/VerificationList';
import MigrationIssues from './pages/MigrationIssues';
import CustomizationPoints from './pages/CustomizationPoints';
import EmailDocumentation from './pages/EmailDocumentation';
import ManualConfiguration from './pages/ManualConfiguration';
import ExcelDataPage from './pages/ExcelData';
import UserManagement from './pages/UserManagement';

import { api } from './services/api';
import { ModuleMaster } from './types';
import { RefreshProvider, useRefresh } from './services/RefreshContext';
import { AuthProvider, useAuth } from './services/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RotateCw } from 'lucide-react';
import { ThemeProvider, useTheme } from './services/ThemeContext';
import { LanguageProvider, useLanguage } from './services/LanguageContext';
import { UserProfileDropdown } from './components/UserProfileDropdown';
import { ThemeToggle, LanguageToggle } from './components/HeaderControls';
import { LoadingOverlay } from './components/LoadingOverlay';

// Modules to hide from sidebar
const HIDDEN_MODULES = ['Fields'];

// Re-export AppContext if needed by legacy components, but try to use AuthContext now
export const AppContext = React.createContext<any>(null);

// ...


const RefreshButton: React.FC = () => {
  const { triggerRefresh, isRefreshing } = useRefresh();
  return (
    <button
      onClick={triggerRefresh}
      disabled={isRefreshing}
      className={`p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
      title="Refresh Page Data"
    >
      <RotateCw size={18} />
    </button>
  );
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts[pathParts.length - 1] || '';

  const getBackPath = () => {
    if (pathParts.length >= 3 && pathParts[0] === 'projects') {
      return `/projects/${pathParts[1]}`;
    }
    return '/';
  };

  const formatPageName = (page: string) => {
    if (!page) return 'Dashboard';
    const nameMap: Record<string, string> = {
      'transfer': 'Data Transfer Checks',
      'verification': 'Verification List',
      'issues': 'Migration Issues',
      'customization': 'Customization Points',
      'manual-config': 'Manual Configuration',
      'excel-data': 'Excel Data',
      'emails': 'Email Documentation',
      'projects': 'Projects',
      'manage-users': 'User Management',
      'webtables': 'Web Tables',
      'databases': 'Databases',
      'fields': 'Fields',
      'modules': 'Modules',
      'quick-work': 'Quick Work'
    };
    return nameMap[page] || page.replace('-', ' ');
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => navigate(getBackPath())}
        className="text-white/60 hover:text-white transition-colors"
      >
        MigraTrack
      </button>
      <ChevronRight size={14} className="text-white/40" />
      <span className="font-semibold text-white capitalize">
        {formatPageName(currentPage) || 'Dashboard'}
      </span>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [moduleGroups, setModuleGroups] = useState<Record<string, ModuleMaster[]>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Theme state is now managed by ThemeContext, but AppContext might still be consumed by legacy
  // For safety, we keep toggles here as aliases or remove if safe. 
  // Let's rely on ThemeContext's global application.

  // Parse Project ID
  const projectMatch = location.pathname.match(/\/projects\/(\d+)/);
  const projectId = projectMatch ? parseInt(projectMatch[1]) : null;

  useEffect(() => {
    api.moduleMaster.getAll().then(data => {
      const grouped = data.reduce((acc, curr) => {
        if (!acc[curr.moduleName]) acc[curr.moduleName] = [];
        acc[curr.moduleName].push(curr);
        return acc;
      }, {} as Record<string, ModuleMaster[]>);
      setModuleGroups(grouped);
    }).catch(err => console.error("Failed to load modules", err));
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppContext.Provider value={{ isDarkMode: theme.mode === 'dark', toggleTheme: () => { } }}>
      <div className="flex h-screen overflow-hidden bg-[#f0f2f5] dark:bg-[#050505]">
        <LoadingOverlay isVisible={false} message="Initializing Application..." />
        
        {/* Mobile Backdrop */}
        <div 
          className={`backdrop ${isSidebarOpen ? 'show' : ''} md:hidden`}
          onClick={() => setIsSidebarOpen(false)}
        />
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
            w-64 md:w-20`}
          style={{ backgroundColor: theme.sidebarColor }}
        >
          <div className="h-16 flex items-center justify-between px-4 md:justify-center border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center font-bold text-white transition-transform hover:scale-110 cursor-pointer" title="MigraTrack">
                M
              </div>
              <span className="font-bold text-lg md:hidden">MigraTrack</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 space-y-2 notion-scrollbar flex flex-col md:items-center">
            <Link to="/" onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${isActive('/') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <LayoutDashboard size={20} />
              <span className="text-sm md:text-[10px] md:mt-1 font-medium">{t('Dashboard')}</span>
            </Link>

            <Link to="/projects" onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${location.pathname.startsWith('/projects') && !projectId ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Users size={20} />
              <span className="text-sm md:text-[10px] md:mt-1 font-medium">{t('Projects')}</span>
            </Link>

            <Link to="/quick-work" onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${isActive('/quick-work') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Code size={20} />
              <span className="text-sm md:text-[10px] md:mt-1 font-medium text-center leading-tight">Quick Work</span>
            </Link>

            {/* Admin Only Link */}
            {user?.role === 'Admin' && (
              <Link to="/admin/manage-users" onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${isActive('/admin/manage-users') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Shield size={20} />
                <span className="text-sm md:text-[10px] md:mt-1 font-medium relative text-center leading-tight">{t('Users')}</span>
              </Link>
            )}

            {(user?.role === 'Admin' || hasPermission('Fields', 'View')) && !HIDDEN_MODULES.includes('Fields') && (
              <Link to="/admin/fields" onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${isActive('/admin/fields') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Settings size={20} />
                <span className="text-sm md:text-[10px] md:mt-1 font-medium">{t('Fields')}</span>
              </Link>
            )}

            {(user?.role === 'Admin' || hasPermission('Module Master', 'View')) && (
              <Link to="/admin/modules" onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${isActive('/admin/modules') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Database size={20} />
                <span className="text-sm md:text-[10px] md:mt-1 font-medium">{t('Modules')}</span>
              </Link>
            )}

            {(user?.role === 'Admin' || hasPermission('Tables', 'View')) && (
              <Link to="/admin/webtables" onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${isActive('/admin/webtables') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Table size={20} />
                <span className="text-sm md:text-[10px] md:mt-1 font-medium">{t('Tables')}</span>
              </Link>
            )}

            {(user?.role === 'Admin' || hasPermission('Database', 'View')) && (
              <Link to="/admin/databases" onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${isActive('/admin/databases') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Server size={20} />
                <span className="text-sm md:text-[10px] md:mt-1 font-medium">{t('Databases')}</span>
              </Link>
            )}



            {projectId && (
              <>
                <div className="w-12 md:w-12 border-t border-white/10 my-1 mx-4 md:mx-0" />
                <Link to={`/projects/${projectId}`} onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${isActive(`/projects/${projectId}`) ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                  <Folder size={20} />
                  <span className="text-sm md:text-[10px] md:mt-1 font-medium">{t('Overview')}</span>
                </Link>
                <Link to={`/projects/${projectId}/customization`} onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${isActive(`/projects/${projectId}/customization`) ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                  <Plus size={20} />
                  <span className="text-sm md:text-[10px] md:mt-1 font-medium">{t('Custom')}</span>
                </Link>
                <Link to={`/projects/${projectId}/issues`} onClick={() => setIsSidebarOpen(false)} className={`flex md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-16 px-4 md:px-0 py-2 rounded-lg transition-colors group/item ${isActive(`/projects/${projectId}/issues`) ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                  <AlertTriangle size={20} />
                  <span className="text-sm md:text-[10px] md:mt-1 font-medium">{t('Issues')}</span>
                </Link>
              </>
            )}

          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-20">
          <header className={`h-14 flex items-center justify-between px-4 md:px-6 bg-[#0f294d] text-white shadow-md z-40 sticky top-0`} style={{ backgroundColor: theme.sidebarColor }}>
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <Breadcrumb />
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>

              <Link
                to="/emails"
                className="hidden sm:flex p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                title={t('Email')}
              >
                <Mail size={20} />
              </Link>

              <div className="hidden sm:block h-6 w-px bg-white/20 mx-1"></div>

              <div className="hidden sm:block">
                <RefreshButton />
              </div>
              <UserProfileDropdown />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f0f2f5] dark:bg-[#050505] notion-scrollbar">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </AppContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <RefreshProvider>
          <AuthProvider>
            <HashRouter>
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* Protected Routes wrapped in Layout */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />

                        <Route path="/projects" element={
                          <ProtectedRoute module="Projects">
                            <ProjectList />
                          </ProtectedRoute>
                        } />

                        <Route path="/projects/:projectId" element={
                          <ProtectedRoute module="Projects">
                            <ProjectDetail />
                          </ProtectedRoute>
                        } />

                        {/* Module Pages */}
                        <Route path="/projects/:projectId/transfer" element={
                          <ProtectedRoute module="Data Transfer Checks">
                            <TransferChecks />
                          </ProtectedRoute>
                        } />

                        <Route path="/projects/:projectId/verification" element={
                          <ProtectedRoute module="Verification List">
                            <VerificationList />
                          </ProtectedRoute>
                        } />

                        <Route path="/projects/:projectId/issues" element={
                          <ProtectedRoute module="Migration Issues">
                            <MigrationIssues />
                          </ProtectedRoute>
                        } />

                        <Route path="/projects/:projectId/customization" element={
                          <ProtectedRoute module="Customization Points">
                            <CustomizationPoints />
                          </ProtectedRoute>
                        } />

                        <Route path="/projects/:projectId/manual-config" element={
                          <ProtectedRoute module="Manual Configuration">
                            <ManualConfiguration />
                          </ProtectedRoute>
                        } />

                        <Route path="/projects/:projectId/excel-data" element={
                          <ProtectedRoute module="Excel Data">
                            <ExcelDataPage />
                          </ProtectedRoute>
                        } />

                        <Route path="/emails" element={
                          <ProtectedRoute module="Email Documentation">
                            <EmailDocumentation />
                          </ProtectedRoute>
                        } />

                        {/* Admin Routes */}
                        <Route path="/admin/manage-users" element={
                          <ProtectedRoute requiredRole="Admin">
                            <UserManagement />
                          </ProtectedRoute>
                        } />

                        <Route path="/admin/fields" element={
                          <ProtectedRoute module="Fields">
                            <FieldManager />
                          </ProtectedRoute>
                        } />

                        <Route path="/admin/modules" element={
                          <ProtectedRoute module="Module Master">
                            <ModuleMasterManager />
                          </ProtectedRoute>
                        } />

                        <Route path="/admin/webtables" element={
                          <ProtectedRoute module="Tables">
                            <WebTableManager />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin/databases" element={
                          <ProtectedRoute module="Database">
                            <DatabaseManager />
                          </ProtectedRoute>
                        } />

                        <Route path="/quick-work" element={
                          <QuickWorkPage />
                        } />

                        <Route path="/projects/:projectId/module/:moduleName" element={<DynamicModulePage />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </HashRouter>
          </AuthProvider>
        </RefreshProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
