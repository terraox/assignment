import React, { useState } from 'react';
import { format, isBefore, isEqual } from 'date-fns';
import { Mail, Briefcase, Clock, CheckCircle2, Calendar, AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import api from '../../utils/api';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface EmployeeDashboardViewProps {
  stats: any;
  onRefresh: () => void;
}

export default function EmployeeDashboardView({ stats, onRefresh }: EmployeeDashboardViewProps) {
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  if (!stats || !stats.employee) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <p className="text-ink-muted text-sm font-medium tracking-wide">
          Unable to load profile data.
        </p>
      </div>
    );
  }

  const handleStatusUpdate = async (taskId: number, newStatus: string) => {
    try {
      setUpdatingTaskId(taskId);
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      onRefresh(); // Re-fetch dashboard data
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const calculateEfficiency = () => {
    if (!stats.tasks || stats.tasks.length === 0) return 0;
    const total = stats.tasks.length;
    const completedOnTime = stats.tasks.filter((t: any) => {
      if (t.status !== 'Completed' || !t.completed_at) return false;
      const completed = new Date(t.completed_at);
      const due = new Date(t.due_date);
      completed.setHours(0,0,0,0);
      due.setHours(0,0,0,0);
      return isBefore(completed, due) || isEqual(completed, due);
    }).length;
    return Math.round((completedOnTime / total) * 100);
  };

  const score = calculateEfficiency();
  let scoreColor = 'text-primary';
  if (score >= 80) scoreColor = 'text-success';
  if (score < 50) scoreColor = 'text-danger';

  // Get current active tasks (In Progress or Pending)
  const activeTasks = stats.tasks.filter((t: any) => t.status === 'In Progress' || t.status === 'Pending');

  return (
    <div className="space-y-8">
      {/* Header & Profile */}
      <div className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-4xl shadow-xl ring-4 ring-primary/20">
            {stats.employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink tracking-tight mb-2">
              {stats.employee.name}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-ink-subtle">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> {stats.employee.email}
              </span>
              {stats.employee.department && (
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> {stats.employee.designation} ({stats.employee.department})
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-8 items-center bg-surface-2/50 px-8 py-4 rounded-2xl border border-hairline/50">
          <div className="text-center">
            <div className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-1">Assigned</div>
            <div className="text-3xl font-bold text-ink"><NumberFlow value={stats.totalTasks} /></div>
          </div>
          <div className="w-px h-12 bg-hairline" />
          <div className="text-center">
            <div className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-1">Efficiency</div>
            <div className={`text-3xl font-bold ${scoreColor}`}>
              <NumberFlow value={score} />%
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Active Tasks Panel */}
        <div className="glass-card flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" /> Current Tasks
            </h3>
            <span className="bg-surface-2 text-ink-muted text-xs font-bold px-2 py-1 rounded-md">
              {activeTasks.length} Active
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
            {activeTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-ink-muted text-sm space-y-2">
                <CheckCircle2 className="w-8 h-8 text-success/50" />
                <p>You're all caught up!</p>
              </div>
            ) : (
              activeTasks.map((task: any) => {
                const isOverdue = isBefore(new Date(task.due_date), new Date()) && task.status !== 'Completed';
                const isUpdating = updatingTaskId === task.id;

                return (
                  <div key={task.id} className="p-5 rounded-2xl bg-surface-2/50 border border-hairline/50 hover:bg-surface-2 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h4 className="text-base font-semibold text-ink leading-tight flex-1">{task.title}</h4>
                      
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild disabled={isUpdating}>
                          <button className={`shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                            task.status === 'In Progress' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-3 text-ink-muted border-hairline'
                          }`}>
                            {isUpdating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                {task.status}
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content className="min-w-[140px] bg-surface-1 rounded-xl shadow-xl border border-hairline/50 p-1 z-50 animate-in fade-in zoom-in-95" sideOffset={5}>
                            <DropdownMenu.Item 
                              onClick={() => handleStatusUpdate(task.id, 'Pending')}
                              className="text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-2 px-3 py-2 rounded-lg cursor-pointer outline-none"
                            >
                              Mark Pending
                            </DropdownMenu.Item>
                            <DropdownMenu.Item 
                              onClick={() => handleStatusUpdate(task.id, 'In Progress')}
                              className="text-sm font-medium text-primary hover:bg-primary/10 px-3 py-2 rounded-lg cursor-pointer outline-none"
                            >
                              Mark In Progress
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="h-px bg-hairline/50 my-1 mx-2" />
                            <DropdownMenu.Item 
                              onClick={() => handleStatusUpdate(task.id, 'Completed')}
                              className="text-sm font-medium text-success hover:bg-success/10 px-3 py-2 rounded-lg cursor-pointer outline-none flex items-center justify-between"
                            >
                              Mark Completed
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-danger' : 'text-ink-subtle'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1.5 text-ink-subtle">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Priority: {task.priority}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Task History Timeline */}
        <div className="glass-card flex flex-col h-[500px]">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-ink mb-6 shrink-0 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" /> Task History
          </h3>
          <div className="flex-1 overflow-y-auto pr-4 no-scrollbar">
            {stats.tasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-muted text-sm">
                No tasks assigned yet.
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-hairline before:to-transparent">
                {stats.tasks.map((task: any) => {
                  const isCompleted = task.status === 'Completed';
                  let isOnTime = false;
                  if (isCompleted && task.completed_at) {
                    const comp = new Date(task.completed_at);
                    const due = new Date(task.due_date);
                    comp.setHours(0,0,0,0); due.setHours(0,0,0,0);
                    isOnTime = isBefore(comp, due) || isEqual(comp, due);
                  }
                  const isLate = task.status === 'Overdue' || (isCompleted && !isOnTime);

                  return (
                    <div key={task.id} className="relative flex items-center group">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-surface-1 shrink-0 z-10 shadow bg-surface-3">
                        {isCompleted ? (
                          isOnTime ? <div className="w-2 h-2 bg-success rounded-full" /> : <div className="w-2 h-2 bg-warning rounded-full" />
                        ) : isLate ? (
                          <div className="w-2 h-2 bg-danger rounded-full animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      
                      <div className="ml-6 flex-1 bg-surface-1 p-4 rounded-xl border border-hairline/50 hover:bg-surface-2 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isCompleted ? (isOnTime ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning') :
                            isLate ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
                          }`}>
                            {isCompleted ? (isOnTime ? 'Completed on time' : 'Completed late') : task.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-ink mb-1">{task.title}</h4>
                        <div className="flex flex-col gap-1 mt-2">
                          <div className="flex items-center gap-2 text-[11px] text-ink-subtle font-medium">
                            Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </div>
                          {isCompleted && task.completed_at && (
                            <div className="flex items-center gap-2 text-[11px] text-ink-muted font-medium">
                              Finished: {format(new Date(task.completed_at), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
