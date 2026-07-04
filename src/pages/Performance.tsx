import { useState, useEffect } from 'react';
import { Users, CheckCircle2, Clock, AlertCircle, ChevronRight, Activity } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';
import api from '../utils/api';
import EmployeeProfileModal from '../components/dashboard/EmployeeProfileModal';

export default function Performance() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await api.get('/dashboard/employee-stats');
        setStats(res.data.employeeStats);
      } catch (error) {
        console.error('Failed to fetch employee stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-ink-muted text-sm font-medium tracking-wide animate-pulse">
            LOADING TEAM PERFORMANCE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full p-6 md:p-10 max-w-[1200px] mx-auto w-full overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-ink to-ink-muted tracking-tight">
            Team Progress
          </h1>
          <p className="text-ink-muted text-sm mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Track individual efficiency and task history across the organization.
          </p>
        </div>

        {/* Per Employee Status Table */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-ink mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Employee Metrics
            <span className="text-xs text-ink-subtle font-normal ml-2 tracking-normal lowercase">(Click any row for detailed profile)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="pb-4 pt-2 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Employee</th>
                  <th className="pb-4 pt-2 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wider text-center">Total Tasks</th>
                  <th className="pb-4 pt-2 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wider w-1/3">Completion Progress</th>
                  <th className="pb-4 pt-2 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Status</th>
                  <th className="pb-4 pt-2 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {stats && stats.map((emp: any) => {
                  const total = Number(emp.total_tasks) || 0;
                  const completed = Number(emp.completed) || 0;
                  const overdue = Number(emp.overdue) || 0;
                  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                  
                  return (
                    <tr 
                      key={emp.id} 
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className="group hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-sm shadow-inner group-hover:scale-105 transition-transform">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-ink text-sm group-hover:text-primary-hover transition-colors">{emp.name}</div>
                            <div className="text-xs text-ink-subtle">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-ink">{total}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Progress.Root 
                            className="relative overflow-hidden bg-surface-3 rounded-full w-full h-2" 
                            value={percentage}
                          >
                            <Progress.Indicator 
                              className="bg-success w-full h-full transition-transform duration-500 ease-out"
                              style={{ transform: `translateX(-${100 - percentage}%)` }} 
                            />
                          </Progress.Root>
                          <span className="text-xs font-medium text-ink-muted w-8">{percentage}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {overdue > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                            <AlertCircle className="w-3 h-3" /> {overdue} Overdue
                          </span>
                        ) : percentage === 100 && total > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                            <CheckCircle2 className="w-3 h-3" /> All Clear
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            <Clock className="w-3 h-3" /> On Track
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right text-ink-muted group-hover:text-ink transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </td>
                    </tr>
                  );
                })}
                {(!stats || stats.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-ink-muted text-sm">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EmployeeProfileModal 
        employeeId={selectedEmployeeId} 
        isOpen={selectedEmployeeId !== null} 
        onClose={() => setSelectedEmployeeId(null)} 
      />
    </div>
  );
}
