import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from './store/slices/authSlice';
import type { RootState } from './store/store';
import Login from './pages/Login';
import Register from './pages/Register';
import Employees from './pages/Employees';
import Tasks from './pages/Tasks';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationDropdown from './components/NotificationDropdown';
import { Logo } from './components/ui/Logo';

function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="h-14 border-b border-surface-3 bg-surface-1 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-ink tracking-tight">
            <Logo className="w-6 h-6" />
            TaskFlow
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-ink-muted">
            <Link to="/" className="hover:text-ink transition-colors">Dashboard</Link>
            {user?.role === 'Admin' && (
              <Link to="/employees" className="hover:text-ink transition-colors">Employees</Link>
            )}
            <Link to="/tasks" className="hover:text-ink transition-colors">Tasks</Link>
            <Link to="/reports" className="hover:text-ink transition-colors">Reports</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <NotificationDropdown />
          <span className="text-ink-muted">{user?.name} ({user?.role})</span>
          <button onClick={handleLogout} className="text-danger hover:text-danger/80 font-medium">Logout</button>
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
