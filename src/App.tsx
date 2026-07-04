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
import { RainbowButton } from './components/ui/rainbow-button';
import { Home, CheckSquare, BarChart2, Users, Target, LogOut } from 'lucide-react';

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
      <header className="h-20 border-b border-surface-3/50 bg-surface-1/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-8 sm:px-12 shrink-0 shadow-sm">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 font-bold text-ink tracking-tight hover:opacity-80 transition-opacity">
            <div className="p-1.5 bg-primary/10 rounded-xl">
              <Logo className="w-7 h-7 text-primary" />
            </div>
            <span className="hidden sm:inline text-xl">TaskFlow</span>
          </Link>
          <div className="h-6 w-px bg-surface-3 hidden md:block" />
          <div className="flex items-center gap-2">
            <ExpandableTabs 
              tabs={navTabs as any}
              className="border-surface-3 bg-surface-2/50 shadow-sm"
              activeColor="text-primary"
              selectedIndex={selectedIndex}
              onChange={(index) => {
                if (index !== null) navigate(navTabs[index].path);
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <NotificationDropdown />
          {user && (
            <div className="hidden sm:flex items-center pl-4 border-l border-surface-3">
              <RainbowButton className="h-10 px-5 text-sm cursor-default hover:opacity-100">
                <span className="font-semibold text-canvas">{user.name}</span>
                <span className="mx-2 text-canvas/20">|</span>
                <span className="text-[11px] font-bold text-primary-focus uppercase tracking-widest">{user.role}</span>
              </RainbowButton>
            </div>
          )}
          <div className="pl-2">
            <button 
              onClick={handleLogout}
              className="group bg-white hover:bg-danger text-canvas hover:text-white px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-canvas shadow-sm flex items-center overflow-hidden"
            >
              <span>Logout</span>
              <div className="w-0 opacity-0 -translate-x-2 group-hover:w-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:ml-1.5 transition-all duration-300 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
            </button>
          </div>
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
