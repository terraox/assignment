import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import api from '../utils/api';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'Admin';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchStats();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full flex items-center justify-center min-h-[400px]">
        <p className="text-ink-muted">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) return null;

  const pieData = [
    { name: 'Completed', value: Number(stats.completedTasks), color: '#3fb950' }, // success
    { name: 'In Progress', value: Number(stats.inProgressTasks), color: '#5e6ad2' }, // primary
    { name: 'Pending', value: Number(stats.pendingTasks), color: '#8b949e' }, // muted
    { name: 'Overdue', value: Number(stats.overdueTasks), color: '#f85149' }, // danger
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Completed', tasks: Number(stats.completedTasks) },
    { name: 'In Progress', tasks: Number(stats.inProgressTasks) },
    { name: 'Pending', tasks: Number(stats.pendingTasks) },
    { name: 'Overdue', tasks: Number(stats.overdueTasks) },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-ink tracking-headline">Dashboard</h1>
        <p className="text-ink-muted text-sm mt-1">
          {isAdmin ? 'Overview of all employees and tasks.' : 'Overview of your assigned tasks.'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isAdmin && (
          <div className="surface-1 rounded-xl border border-surface-3 p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-ink-muted text-sm font-medium">
              <Users className="w-4 h-4" /> Total Employees
            </div>
            <div className="text-3xl font-semibold text-ink">{stats.totalEmployees}</div>
          </div>
        )}
        <div className="surface-1 rounded-xl border border-surface-3 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-success text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Completed Tasks
          </div>
          <div className="text-3xl font-semibold text-ink">
            {stats.completedTasks} <span className="text-sm font-normal text-ink-muted">/ {stats.totalTasks}</span>
          </div>
        </div>
        <div className="surface-1 rounded-xl border border-surface-3 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-ink-muted text-sm font-medium">
            <Clock className="w-4 h-4" /> Pending & In Progress
          </div>
          <div className="text-3xl font-semibold text-ink">
            {Number(stats.pendingTasks) + Number(stats.inProgressTasks)}
          </div>
        </div>
        <div className="surface-1 rounded-xl border border-surface-3 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-danger text-sm font-medium">
            <AlertCircle className="w-4 h-4" /> Overdue Tasks
          </div>
          <div className="text-3xl font-semibold text-ink">{stats.overdueTasks}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="surface-1 rounded-xl border border-surface-3 p-6">
          <h3 className="text-sm font-medium text-ink mb-6">Task Status Distribution</h3>
          <div className="h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                    itemStyle={{ color: '#c9d1d9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-ink-muted text-sm">
                No tasks available to visualize.
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-ink-muted">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        <div className="surface-1 rounded-xl border border-surface-3 p-6">
          <h3 className="text-sm font-medium text-ink mb-6">Tasks Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                <XAxis dataKey="name" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#21262d' }}
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                />
                <Bar dataKey="tasks" fill="#5e6ad2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
