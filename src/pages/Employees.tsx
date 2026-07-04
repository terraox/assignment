import { useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit2, Trash2, Plus, Search, ArrowDownAZ, ArrowUpZA, List, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../utils/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import EmployeeProfileModal from '../components/dashboard/EmployeeProfileModal';

interface Employee {
  id: number;
  user_id: number;
  department: string;
  designation: string;
  name: string;
  email: string;
  created_at: string;
}

const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8).optional(),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function Employees() {
  const [data, setData] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Pagination, Sorting & Filtering State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'pagination' | 'infinite'>('pagination');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewEmployeeId, setViewEmployeeId] = useState<number | null>(null);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    api.get('/departments').then(res => setDepartments(res.data)).catch(console.error);
  }, []);

  const fetchEmployees = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await api.get('/employees', {
        params: { 
          page: pageNum, 
          limit, 
          search,
          department: departmentFilter !== 'All' ? departmentFilter : undefined,
          sortBy: 'name',
          sortOrder
        },
      });
      
      if (viewMode === 'infinite' && pageNum > 1) {
        setData(prev => [...prev, ...res.data.data]);
      } else {
        setData(res.data.data);
      }
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchEmployees(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, limit, viewMode, departmentFilter, sortOrder]);

  useEffect(() => {
    if (page > 1) {
      fetchEmployees(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const columnHelper = createColumnHelper<Employee>();
  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => <div className="font-medium text-ink">{info.getValue()}</div>,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => <div className="text-ink-muted">{info.getValue()}</div>,
    }),
    columnHelper.accessor('department', {
      header: 'Department',
    }),
    columnHelper.accessor('designation', {
      header: 'Designation',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (props) => (
        <div className="flex gap-2">
          <button
            onClick={() => setViewEmployeeId(props.row.original.id)}
            className="p-2 text-ink-muted hover:text-primary transition-colors rounded-md hover:bg-surface-2"
            title="View Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button
            onClick={() => openModal(props.row.original)}
            className="p-2 text-ink-muted hover:text-primary transition-colors rounded-md hover:bg-surface-2"
            title="Edit Employee"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedEmployee(props.row.original);
              setIsDeleteOpen(true);
            }}
            className="p-2 text-ink-muted hover:text-danger transition-colors rounded-md hover:bg-surface-2"
            title="Delete Employee"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const openModal = (emp?: Employee) => {
    setSelectedEmployee(emp || null);
    if (emp) {
      reset({
        name: emp.name,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
      });
    } else {
      reset({ name: '', email: '', password: '', department: '', designation: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: EmployeeFormValues) => {
    try {
      if (selectedEmployee) {
        await api.put(`/employees/${selectedEmployee.id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to save employee', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await api.delete(`/employees/${selectedEmployee.id}`);
      setIsDeleteOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-ink tracking-headline">Employees</h1>
          <p className="text-ink-muted text-sm mt-1">Manage your team members and their roles.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between rounded-xl">
        <div className="flex flex-wrap items-center gap-6 w-full">
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-2 border border-hairline-strong rounded-lg h-9 text-xs pl-9 pr-3 w-[180px] text-ink shadow-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Dept</span>
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-surface-2 border border-hairline-strong rounded-lg h-9 text-xs px-3 text-ink shadow-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="All">All Departments</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Sort Name</span>
            <button
              onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
              className="bg-surface-2 hover:bg-surface-3 border border-hairline-strong rounded-lg h-9 px-3 flex items-center gap-2 text-xs font-medium text-ink shadow-sm transition-colors"
            >
              {sortOrder === 'ASC' ? <ArrowDownAZ className="w-4 h-4 text-primary" /> : <ArrowUpZA className="w-4 h-4 text-primary" />}
              {sortOrder === 'ASC' ? 'A to Z' : 'Z to A'}
            </button>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">View Mode</span>
            <div className="flex bg-surface-2 p-1 rounded-lg border border-hairline">
              <button 
                onClick={() => setViewMode('pagination')}
                className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-2 ${viewMode === 'pagination' ? 'bg-white text-canvas font-bold shadow-sm' : 'text-ink-muted font-medium hover:text-ink hover:bg-surface-3/50'}`}
              >
                <List className="w-3.5 h-3.5" /> Pages
              </button>
              <button 
                onClick={() => setViewMode('infinite')}
                className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-2 ${viewMode === 'infinite' ? 'bg-white text-canvas font-bold shadow-sm' : 'text-ink-muted font-medium hover:text-ink hover:bg-surface-3/50'}`}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Infinite
              </button>
            </div>
          </div>
          
        </div>
      </div>

      <div className="surface-1 rounded-xl border border-surface-3 overflow-hidden">
        <div className="p-4 border-b border-surface-3 flex justify-between items-center bg-surface-1">
          <h2 className="text-sm font-semibold text-ink">Employee Directory</h2>
          
          {viewMode === 'pagination' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-muted">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-surface-2 border border-hairline-strong rounded-md text-xs py-1 px-2 text-ink focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}
        </div>

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
                    Loading employees...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-ink-muted">
                    No employees found.
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

        {/* Footer / Pagination / Infinite Scroll */}
        {viewMode === 'pagination' ? (
          <div className="p-4 border-t border-surface-3 flex items-center justify-between bg-surface-1">
            <div className="text-sm text-ink-muted">
              Showing {data.length === 0 ? 0 : ((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          data.length < total && (
            <div className="p-4 border-t border-surface-3 flex justify-center bg-surface-1">
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                className="btn-secondary text-sm px-6"
              >
                {loading ? 'Loading...' : 'Load More Employees'}
              </button>
            </div>
          )
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Full Name</label>
              <input type="text" {...register('name')} className="input" disabled={!!selectedEmployee} />
              {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Email</label>
              <input type="email" {...register('email')} className="input" disabled={!!selectedEmployee} />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>
            {!selectedEmployee && (
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1">Password</label>
                <input type="password" {...register('password')} className="input" />
                {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-ink-muted">Department</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCreatingDepartment(!isCreatingDepartment);
                      // Clear the value when switching so it doesn't hold an invalid selection
                      reset({ ...getValues(), department: '' });
                    }}
                    className="text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    {isCreatingDepartment ? 'Select Existing' : '+ Create New'}
                  </button>
                </div>
                {isCreatingDepartment ? (
                  <input type="text" {...register('department')} className="input" placeholder="Type new department name" />
                ) : (
                  <select {...register('department')} className="input">
                    <option value="">Select department...</option>
                    {departments.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                )}
                {errors.department && <p className="text-danger text-xs mt-1">{errors.department.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1">Designation</label>
                <input type="text" {...register('designation')} className="input" />
                {errors.designation && <p className="text-danger text-xs mt-1">{errors.designation.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving...' : 'Save Employee'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-ink-muted">
              Are you sure you want to delete <span className="font-semibold text-ink">{selectedEmployee?.name}</span>? This action cannot be undone.
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

      <EmployeeProfileModal 
        employeeId={viewEmployeeId} 
        isOpen={viewEmployeeId !== null} 
        onClose={() => setViewEmployeeId(null)} 
      />
    </div>
  );
}
