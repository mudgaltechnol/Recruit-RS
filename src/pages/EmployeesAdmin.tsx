import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, ChevronLeft, ChevronRight, Mail, MoreVertical, Pencil, Plus, Power, Search, Shield, Trash2, UserRound, Users } from 'lucide-react';
import { adminService } from '../services/adminService';
import { Loader } from '../components/Loader';
import { EmployeeDialog } from '../components/EmployeeDialog';
import { cn } from '@/src/lib/utils';

export const EmployeesAdmin = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['admin-employees'],
    queryFn: () => adminService.getEmployees(),
  });

  const createMutation = useMutation({
    mutationFn: (employeeData: any) => {
      console.log('[employees][create][mutation-input]', employeeData);
      return adminService.addEmployee(employeeData);
    },
    onSuccess: () => {
      console.log('[employees][create][mutation-success]');
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      setEditingEmployee(null);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('[employees][create][mutation-error]', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      setEditingEmployee(null);
      setIsDialogOpen(false);
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'Active' | 'Inactive' }) => adminService.updateEmployeeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
    }
  });

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee: any) => {
      const matchesSearch = [employee.name, employee.email, employee.position, employee.address]
        .filter(Boolean)
        .some((value: string) => value.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'All Status' || employee.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter]);

  // Reset page when filters change
  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const employeeStats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((employee: any) => employee.status === 'Active').length;
    const admins = employees.filter((employee: any) => Number(employee.type) === 1).length;

    return {
      total,
      active,
      inactive: total - active,
      admins,
    };
  }, [employees]);

  const handleSaveEmployee = async (employeeData: any) => {
    console.log('[employees][save][start]', { editingEmployee, employeeData });
    if (editingEmployee) {
      await updateMutation.mutateAsync({ id: editingEmployee.id, data: employeeData });
    } else {
      await createMutation.mutateAsync(employeeData);
    }
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setIsDialogOpen(true);
    setActiveMenu(null);
  };

  const handleToggleStatus = (employee: any) => {
    const nextStatus = employee.status === 'Active' ? 'Inactive' : 'Active';
    statusMutation.mutate({ id: employee.id, status: nextStatus });
    setActiveMenu(null);
  };

  const handleDelete = (employee: any) => {
    if (window.confirm(`Delete ${employee.name}?`)) {
      deleteMutation.mutate(employee.id);
      setActiveMenu(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader message="Loading Employees..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tighter mb-2">Employees</h1>
          <p className="text-on-surface-variant font-medium">Create, update, deactivate, and remove employee access.</p>
        </div>
        <button
          onClick={() => {
            setEditingEmployee(null);
            setIsDialogOpen(true);
          }}
          className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary-container transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Total Employees</p>
          <p className="text-3xl font-black text-primary">{employeeStats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Active</p>
          <p className="text-3xl font-black text-emerald-600">{employeeStats.active}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Inactive</p>
          <p className="text-3xl font-black text-amber-600">{employeeStats.inactive}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Admins</p>
          <p className="text-3xl font-black text-secondary">{employeeStats.admins}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl editorial-shadow border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees by name, email, position, or address..."
            className="w-full bg-slate-50 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border-none text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg text-slate-600 w-full md:w-auto"
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      <div className="hidden lg:block bg-white rounded-2xl editorial-shadow border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-8 py-4">Employee</th>
                <th className="px-8 py-4">Role</th>
                <th className="px-8 py-4">Contact</th>
                <th className="px-8 py-4">Address</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400">No employees found.</td>
                </tr>
              ) : paginatedEmployees.map((employee: any) => (
                <tr key={employee.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                        {(employee.name || 'E').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{employee.name}</p>
                        <p className="text-xs text-slate-400">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-primary">{employee.position || 'No position assigned'}</p>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          Number(employee.type) === 1 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {Number(employee.type) === 1 ? <Shield size={12} /> : <UserRound size={12} />}
                          {Number(employee.type) === 1 ? 'Admin' : 'Employee'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-2"><Mail size={12} /> {employee.email}</p>
                      <p className="text-xs font-medium text-slate-600">{employee.mobile || 'No mobile added'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-slate-500 max-w-[220px]">{employee.address || 'No address added'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      employee.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      <BadgeCheck size={12} />
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="relative flex justify-end">
                      <button
                        onClick={() => setActiveMenu(activeMenu === String(employee.id) ? null : String(employee.id))}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenu === String(employee.id) && (
                        <div className="absolute top-10 right-0 z-20 w-48 rounded-2xl border border-slate-100 bg-white shadow-xl p-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil size={14} /> Edit Employee
                          </button>
                          <button
                            onClick={() => handleToggleStatus(employee)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Power size={14} /> {employee.status === 'Active' ? 'Mark Inactive' : 'Mark Active'}
                          </button>
                          <button
                            onClick={() => handleDelete(employee)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} /> Delete Employee
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <div className="p-5 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {paginatedEmployees.length} of {filteredEmployees.length} employees</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", page === currentPage ? "bg-primary text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50")}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {paginatedEmployees.map((employee: any) => (
          <div key={employee.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <p className="text-lg font-black text-primary truncate">{employee.name}</p>
                <p className="text-xs text-slate-400 truncate">{employee.email}</p>
              </div>
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                employee.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              )}>
                {employee.status}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-500">
              <p>{employee.position || 'No position assigned'}</p>
              <p>{Number(employee.type) === 1 ? 'Admin' : 'Employee'}</p>
              <p>{employee.mobile || 'No mobile added'}</p>
              <p>{employee.address || 'No address added'}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleEdit(employee)} className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">Edit</button>
              <button onClick={() => handleToggleStatus(employee)} className="px-3 py-2 rounded-xl bg-amber-50 text-xs font-bold text-amber-700">
                {employee.status === 'Active' ? 'Inactive' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(employee)} className="px-3 py-2 rounded-xl bg-red-50 text-xs font-bold text-red-600">Delete</button>
            </div>
          </div>
        ))}
        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", page === currentPage ? "bg-primary text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50")}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      <EmployeeDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        initialData={editingEmployee}
      />
    </div>
  );
};
