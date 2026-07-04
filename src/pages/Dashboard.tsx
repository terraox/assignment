import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import api from '../utils/api';
import NumberFlow from '@number-flow/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Users, CheckCircle2, Clock, AlertCircle, 
  TrendingUp, Activity, Briefcase, Calendar, ChevronRight
} from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import EmployeeDashboardView from '../components/dashboard/EmployeeDashboardView';

export default function Dashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'Admin';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const endpoint = isAdmin ? '/dashboard/admin' : '/dashboard/employee';
      const res = await api.get(endpoint);
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-ink-muted text-sm font-medium tracking-wide animate-pulse">
            INITIALIZING DASHBOARD...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Render Employee specific view
  if (!isAdmin) {
    return (
      <div className="relative min-h-full p-6 md:p-10 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* Background Glowing Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
        
        <div className="relative z-10">
          <EmployeeDashboardView stats={stats} onRefresh={fetchStats} />
        </div>
      </div>
    );
  }

  // Dummy chart data for visually stunning graphics (would be replaced with real timeseries data)
  const chartData = [
    { name: 'Mon', completed: 12, overdue: 2 },
    { name: 'Tue', completed: 18, overdue: 4 },
    { name: 'Wed', completed: 15, overdue: 1 },
    { name: 'Thu', completed: 25, overdue: 3 },
    { name: 'Fri', completed: 32, overdue: 0 },
    { name: 'Sat', completed: 28, overdue: 2 },
    { name: 'Sun', completed: Math.max(Number(stats.completedTasks), 35), overdue: Number(stats.overdueTasks) },
  ];

  return (
    <div className="relative min-h-full p-6 md:p-10 max-w-[1600px] mx-auto w-full overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-success/10 rounded-full blur-[150px] pointer-events-none opacity-50" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-ink to-ink-muted tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-ink-muted text-sm mt-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {user?.name ? `Welcome back, ${user.name}.` : 'Welcome back!'} 
              <span className="opacity-50">|</span> 
              System Status: <span className="text-success font-medium flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success animate-pulse"/> Online</span>
            </p>
          </div>
        </div>

        {/* Metric Cards - Spread out with grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
          {isAdmin && (
            <div className="glass-card group hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-ink-muted text-sm font-medium tracking-wide uppercase">
                  <Users className="w-4 h-4 text-primary" /> Employees
                </div>
              </div>
              <div className="text-5xl font-bold text-ink flex items-baseline gap-2">
                <NumberFlow value={Number(stats.totalEmployees)} />
                <span className="text-sm font-normal text-ink-subtle">total</span>
              </div>
            </div>
          )}
          <div className="glass-card group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-ink-muted text-sm font-medium tracking-wide uppercase">
                <Briefcase className="w-4 h-4 text-ink" /> Total Tasks
              </div>
            </div>
            <div className="text-5xl font-bold text-ink flex items-baseline gap-2">
              <NumberFlow value={Number(stats.totalTasks)} />
              <span className="text-sm font-normal text-ink-subtle">assigned</span>
            </div>
          </div>
          <div className="glass-card group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-success text-sm font-medium tracking-wide uppercase">
                <CheckCircle2 className="w-4 h-4" /> Completed
              </div>
              <TrendingUp className="w-4 h-4 text-success opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-5xl font-bold text-ink flex items-baseline gap-2">
              <NumberFlow value={Number(stats.completedTasks)} />
              <span className="text-sm font-normal text-ink-subtle">/ <NumberFlow value={Number(stats.totalTasks)} /></span>
            </div>
            <div className="mt-6 w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-1000 ease-out" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="glass-card group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-danger text-sm font-medium tracking-wide uppercase">
                <AlertCircle className="w-4 h-4" /> Overdue
              </div>
            </div>
            <div className="text-5xl font-bold text-danger flex items-baseline gap-2">
              <NumberFlow value={Number(stats.overdueTasks)} />
              <span className="text-sm font-normal text-ink-subtle">late</span>
            </div>
          </div>
        </div>

        {/* Charts & Recent Tasks Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-auto xl:h-[450px]">
          {/* Main Area Chart - Maximized space */}
          <div className="glass-card xl:col-span-2 flex flex-col h-[400px] xl:h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-ink">Velocity & Volume</h3>
              <div className="flex items-center gap-4 text-xs font-medium text-ink-muted">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Completed
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-danger" /> Overdue
                </div>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-ink-subtle)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-ink-subtle)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 16, 17, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'var(--color-hairline)', borderRadius: '8px', color: 'var(--color-ink)' }}
                    itemStyle={{ color: 'var(--color-ink)' }}
                  />
                  <Area type="monotone" dataKey="completed" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                  <Area type="monotone" dataKey="overdue" stroke="var(--color-danger)" strokeWidth={3} fillOpacity={1} fill="url(#colorOverdue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Tasks List */}
          <div className="glass-card flex flex-col h-[400px] xl:h-full">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-ink mb-6 shrink-0">Recent Tasks</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
              {stats.recentTasks && stats.recentTasks.length > 0 ? (
                stats.recentTasks.map((task: any) => (
                  <div key={task.id} className="p-4 rounded-xl bg-surface-2/50 border border-hairline/50 hover:bg-surface-2 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium text-ink leading-tight line-clamp-1">{task.title}</h4>
                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        task.status === 'Completed' ? 'bg-success/10 text-success' :
                        task.status === 'Overdue' ? 'bg-danger/10 text-danger' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-ink-subtle">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {task.assigned_to || 'Unassigned'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(task.due_date), 'MMM d')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-ink-muted text-sm">
                  No recent tasks.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
