import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from './store/slices/authSlice';
import type { RootState } from './store/store';
import Login from './pages/Login';
import Register from './pages/Register';
import Employees from './pages/Employees';
import Tasks from './pages/Tasks';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Performance from './pages/Performance';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationDropdown from './components/NotificationDropdown';
import { Logo } from './components/ui/Logo';
import { InteractiveHoverButton } from './components/ui/interactive-hover-button';
import { ExpandableTabs } from './components/ui/expandable-tabs';
import { Home, CheckSquare, BarChart2, Users, Target } from 'lucide-react';

function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navTabs = [
    { title: "Dashboard", icon: Home, path: "/" },
    { title: "Tasks", icon: CheckSquare, path: "/tasks" },
    { title: "Reports", icon: BarChart2, path: "/reports" },
    ...(user?.role === 'Admin' ? [
      { title: "Employees", icon: Users, path: "/employees" },
      { title: "Team Progress", icon: Target, path: "/performance" }
    ] : [])
  ];

  const location = useLocation();
  const activeIndex = navTabs.findIndex(tab => tab.path === location.pathname);
  const selectedIndex = activeIndex >= 0 ? activeIndex : null;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="h-14 border-b border-surface-3 bg-surface-1 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-ink tracking-tight">
            <Logo className="w-6 h-6" />
            <span className="hidden sm:inline">TaskFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <ExpandableTabs 
              tabs={navTabs as any}
              className="border-surface-3 bg-surface-2"
              activeColor="text-primary"
              selectedIndex={selectedIndex}
              onChange={(index) => {
                if (index !== null) navigate(navTabs[index].path);
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <NotificationDropdown />
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-ink-muted">
              <span>{user.name}</span>
              <span className="text-[11px] font-medium bg-surface-3 px-2 py-0.5 rounded-full text-ink uppercase tracking-wider">{user.role}</span>
            </div>
          )}
          <InteractiveHoverButton onClick={handleLogout}>
            Logout
          </InteractiveHoverButton>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/employees" element={
          <Layout>
            <Employees />
          </Layout>
        } />
        <Route path="/performance" element={
          <Layout>
            <Performance />
          </Layout>
        } />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/tasks" element={
          <Layout>
            <Tasks />
          </Layout>
        } />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/reports" element={
          <Layout>
            <Reports />
          </Layout>
        } />
      </Route>
    </Routes>
  )
}

export default App
