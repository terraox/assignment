import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CheckCircle2, AlertCircle, Clock, Calendar, Mail, Briefcase } from 'lucide-react';
import api from '../../utils/api';
import { format, isBefore, isEqual, parseISO } from 'date-fns';

interface EmployeeProfileModalProps {
  employeeId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeProfileModal({ employeeId, isOpen, onClose }: EmployeeProfileModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employeeId) {
      setLoading(true);
      api.get(`/dashboard/employee/${employeeId}/history`)
        .then(res => setData(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, employeeId]);

  if (!isOpen) return null;

  const calculateEfficiency = () => {
    if (!data || !data.tasks || data.tasks.length === 0) return 0;
    const total = data.tasks.length;
    const completedOnTime = data.tasks.filter((t: any) => {
      if (t.status !== 'Completed' || !t.completed_at) return false;
      const completed = new Date(t.completed_at);
      const due = new Date(t.due_date);
      // Strip time for accurate date comparison
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-canvas/80 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-surface-1 border border-hairline shadow-2xl rounded-xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
          {loading || !data ? (
            <div className="p-12 flex flex-col items-center justify-center h-64">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-ink-muted text-sm tracking-wide">Loading Profile...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative p-6 border-b border-hairline bg-surface-2/50">
                <Dialog.Close className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-3 transition-colors text-ink-subtle hover:text-ink">
                  <X className="w-4 h-4" />
                </Dialog.Close>
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-primary/20">
                    {data.employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 pt-1">
                    <Dialog.Title className="text-2xl font-bold text-ink tracking-tight mb-1">
                      {data.employee.name}
                    </Dialog.Title>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
                      <div className="flex w-fit items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full shadow-sm transition-all hover:bg-primary/20">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <span className="text-sm font-medium text-primary-hover">{data.employee.email}</span>
                      </div>
                      {data.employee.department && (
                        <div className="flex w-fit items-center gap-2 bg-surface-2 border border-surface-3 px-3 py-1.5 rounded-full shadow-sm transition-all hover:bg-surface-3">
                          <Briefcase className="w-3.5 h-3.5 text-ink-muted" />
                          <span className="text-sm font-medium text-ink-subtle">
                            <span className="text-ink">{data.employee.designation}</span>
                            <span className="opacity-60 ml-1">({data.employee.department})</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center pr-6">
                    <div className={`text-4xl font-bold tracking-tighter ${scoreColor}`}>
                      {score}%
                    </div>
                    <div className="text-xs font-semibold text-ink-muted uppercase tracking-widest mt-1">
                      Efficiency
                    </div>
                  </div>
                </div>
              </div>

              {/* Task History Timeline */}
              <div className="flex-1 overflow-y-auto p-6 bg-surface-1">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-ink-muted mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Task History
                </h3>
                
                {data.tasks.length === 0 ? (
                  <div className="text-center py-12 text-ink-subtle text-sm">
                    No tasks assigned yet.
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-hairline before:to-transparent">
                    {data.tasks.map((task: any) => {
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
                        <div key={task.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-surface-1 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow bg-surface-3 z-10">
                            {isCompleted ? (
                              isOnTime ? <div className="w-2 h-2 bg-success rounded-full" /> : <div className="w-2 h-2 bg-warning rounded-full" />
                            ) : isLate ? (
                              <div className="w-2 h-2 bg-danger rounded-full animate-pulse" />
                            ) : (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] glass p-4 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isCompleted ? (isOnTime ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning') :
                                isLate ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
                              }`}>
                                {isCompleted ? (isOnTime ? 'Completed on time' : 'Completed late') : task.status}
                              </span>
                              <span className="text-xs text-ink-subtle font-medium">
                                {task.priority} Priority
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-ink mb-1">{task.title}</h4>
                            <div className="flex flex-col gap-1 mt-3">
                              <div className="flex items-center gap-2 text-xs text-ink-subtle">
                                <Calendar className="w-3.5 h-3.5" /> Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                              </div>
                              {isCompleted && task.completed_at && (
                                <div className="flex items-center gap-2 text-xs text-ink-muted font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Finished: {format(new Date(task.completed_at), 'MMM d, yyyy')}
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
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
