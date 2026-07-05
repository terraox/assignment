import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit2, Trash2, Plus, Calendar, Paperclip, UploadCloud, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import type { RootState } from '../store/store';
import api from '../utils/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  start_date: string;
  due_date: string;
  assigned_employee_id: number | null;
  assigned_employee_name?: string;
  file_path?: string;
}

interface Employee {
  id: number;
  name: string;
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Overdue']).default('Pending'),
  start_date: z.string().min(1, 'Start date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  assigned_employee_id: z.string().optional(),
}).refine((data) => {
  return new Date(data.start_date) <= new Date(data.due_date);
}, {
  message: "Start date must be before or equal to due date",
  path: ["due_date"],
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function Tasks() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'Admin';
  
  const [data, setData] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const filteredData = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    return data.filter(task => {
      let statusMatch = true;
      let timeMatch = true;
      let dateMatch = true;
      
      if (statusFilter !== 'All') {
        statusMatch = task.status === statusFilter;
      }
      
      if (timeFilter === 'Overdue') {
        timeMatch = task.status === 'Overdue' || new Date(task.due_date) < today;
      } else if (timeFilter === 'On Time') {
        timeMatch = task.status !== 'Overdue' && new Date(task.due_date) >= today;
      }

      if (dateFilter) {
        const taskDate = new Date(task.due_date).toISOString().split('T')[0];
        dateMatch = taskDate === dateFilter;
      }
      
      return statusMatch && timeMatch && dateMatch;
    });
  }, [data, statusFilter, timeFilter, dateFilter]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/employees?limit=100');
      setEmployees(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, [isAdmin]);

  const columnHelper = createColumnHelper<Task>();
  const columns = [
    columnHelper.accessor('title', {
      header: 'Task',
      cell: (info) => (
        <div>
          <div className="font-medium text-ink flex items-center gap-2">
            {info.getValue()}
            {info.row.original.file_path && (
              <a 
                href={`http://localhost:5001${info.row.original.file_path}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:text-primary-focus transition-colors"
                title="View Attachment"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          {info.row.original.description && (
            <div className="text-xs text-ink-muted line-clamp-1 mt-0.5">{info.row.original.description}</div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const val = info.getValue();
        let color = 'bg-surface-3 text-ink';
        if (val === 'Completed') color = 'bg-success/20 text-success';
        if (val === 'In Progress') color = 'bg-primary/20 text-primary';
        if (val === 'Overdue') color = 'bg-danger/20 text-danger';
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{val}</span>;
      },
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
    }),
    ...(isAdmin ? [
      columnHelper.accessor('assigned_employee_name', {
        header: 'Assignee',
        cell: (info) => <div className="text-sm">{info.getValue() || 'Unassigned'}</div>,
      })
    ] : []),
    columnHelper.accessor('due_date', {
      header: 'Due Date',
      cell: (info) => {
        const date = new Date(info.getValue());
        return (
          <div className="flex items-center gap-1.5 text-sm text-ink-muted">
            <Calendar className="w-3.5 h-3.5" />
            {date.toLocaleDateString()}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (props) => {
        const isCompleted = props.row.original.status === 'Completed';
        const canEdit = !isCompleted; // Business Rule: Completed tasks cannot be edited

        return (
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={() => openModal(props.row.original)}
                className="p-2 text-ink-muted hover:text-primary transition-colors rounded-md hover:bg-surface-2"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  setSelectedTask(props.row.original);
                  setIsDeleteOpen(true);
                }}
                className="p-2 text-ink-muted hover:text-danger transition-colors rounded-md hover:bg-surface-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const openModal = (task?: Task) => {
    setSelectedTask(task || null);
    setSelectedFile(null);
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        start_date: new Date(task.start_date).toISOString().split('T')[0],
        due_date: new Date(task.due_date).toISOString().split('T')[0],
        assigned_employee_id: task.assigned_employee_id?.toString() || '',
      });
    } else {
      reset({ 
        title: '', 
        description: '', 
        priority: 'Medium', 
        status: 'Pending',
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        assigned_employee_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: TaskFormValues) => {
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          data.append(key, value);
        }
      });
      if (selectedFile) {
        data.append('file', selectedFile);
      }

      if (selectedTask) {
        await api.put(`/tasks/${selectedTask.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/tasks', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to save task', error);
      alert('Failed to save task. Ensure file is under 5MB and is a PDF/JPG/PNG.');
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      setIsDeleteOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-ink tracking-headline">Tasks</h1>
          <p className="text-ink-muted text-sm mt-1">
            {isAdmin ? 'Manage all tasks across the organization.' : 'Manage your assigned tasks.'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between rounded-xl">
        <div className="flex flex-wrap items-center gap-6 w-full">
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Status</span>
            <div className="flex bg-surface-2 p-1 rounded-lg border border-hairline">
              {['All', 'Pending', 'In Progress', 'Completed'].map(s => (
                <button 
                  key={s} 
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${statusFilter === s ? 'bg-white text-canvas font-bold shadow-sm' : 'text-ink-muted font-medium hover:text-ink hover:bg-surface-3/50'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Timing Filter */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Timing</span>
            <div className="flex bg-surface-2 p-1 rounded-lg border border-hairline">
              {['All', 'On Time', 'Overdue'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setTimeFilter(t)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${timeFilter === t ? 'bg-white text-canvas font-bold shadow-sm' : 'text-ink-muted font-medium hover:text-ink hover:bg-surface-3/50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter & Clear All */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Due Date</span>
              <div className="relative">
                <input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-surface-2 border border-hairline-strong rounded-lg h-9 text-xs pl-9 pr-8 w-[165px] text-ink shadow-sm focus:outline-none focus:border-primary transition-colors [color-scheme:dark]" 
                />
                <Calendar className="w-4 h-4 text-ink-muted absolute left-3 top-2.5 pointer-events-none" />
                {dateFilter && (
                  <button 
                    onClick={() => setDateFilter('')}
                    className="absolute right-2 top-2.5 text-ink-subtle hover:text-ink text-xs font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {(statusFilter !== 'All' || timeFilter !== 'All' || dateFilter) && (
              <button 
                onClick={() => {
                  setStatusFilter('All');
                  setTimeFilter('All');
                  setDateFilter('');
                }}
                className="text-xs font-semibold text-danger hover:text-white transition-colors px-3 py-2 bg-danger/10 hover:bg-danger rounded-lg ml-2 whitespace-nowrap shadow-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="surface-1 rounded-xl border border-surface-3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-2 text-ink-muted text-[13px] uppercase tracking-wider">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-3 font-medium">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-surface-3">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-ink-muted">
                    Loading tasks...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-ink-muted">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-2 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Title</label>
              <input type="text" {...register('title')} className="input" disabled={!isAdmin} />
              {errors.title && <p className="text-danger text-xs mt-1">{errors.title.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Description</label>
              <textarea {...register('description')} className="input min-h-[80px]" disabled={!isAdmin} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1">Status</label>
                <div className="relative">
                  <select {...register('status')} className="input appearance-none pr-10">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue" disabled={!isAdmin}>Overdue</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1">Priority</label>
                <div className="relative">
                  <select {...register('priority')} className="input appearance-none pr-10" disabled={!isAdmin}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1">Start Date</label>
                <input type="date" {...register('start_date')} className="input" disabled={!isAdmin} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1">Due Date</label>
                <input type="date" {...register('due_date')} className="input" disabled={!isAdmin} />
                {errors.due_date && <p className="text-danger text-xs mt-1">{errors.due_date.message}</p>}
              </div>
            </div>

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1">Assign To</label>
                <div className="relative">
                  <select {...register('assigned_employee_id')} className="input appearance-none pr-10">
                    <option value="">Unassigned</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Attachment</label>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-surface-3 hover:border-ink-muted bg-surface-2'
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-8 h-8 mx-auto text-ink-muted mb-2" />
                {selectedFile ? (
                  <p className="text-sm font-medium text-ink">{selectedFile.name}</p>
                ) : (
                  <div>
                    <p className="text-sm text-ink font-medium">Drag & drop or click to upload</p>
                    <p className="text-xs text-ink-muted mt-1">PDF, JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      {isAdmin && (
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm text-ink-muted">
                Are you sure you want to delete <span className="font-semibold text-ink">{selectedTask?.title}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsDeleteOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleDelete} className="btn-primary bg-danger hover:bg-danger/90">
                  Delete
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
