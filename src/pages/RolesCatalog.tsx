import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Briefcase,
  MapPin,
  IndianRupee,
  Activity,
  Trash2,
  Edit2,
  Download,
  Calendar,
  PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn, formatRupeeAmount } from '@/src/lib/utils';

import { adminService } from '../services/adminService';
import { Loader } from '../components/Loader';
import { RoleDialog } from '../components/RoleDialog';
import { CandidateProfileDialog } from '../components/CandidateProfileDialog';
import { RoleCandidateSheet } from '../components/RoleCandidateSheet';
import { CandidateFormDialog } from '../components/CandidateFormDialog';

export const RolesCatalog = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('All Clients');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [expandedApplicantRoles, setExpandedApplicantRoles] = useState<string[]>([]);
  const [selectedRoleForCandidates, setSelectedRoleForCandidates] = useState<any | null>(null);
  const [isCandidateSheetOpen, setIsCandidateSheetOpen] = useState(false);
  const [isCandidateFormOpen, setIsCandidateFormOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminService.getRoles(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
  });

  const createMutation = useMutation({
    mutationFn: (newRole: any) => adminService.addRole(newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setIsDialogOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setIsDialogOpen(false);
      setEditingRole(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    }
  });

  const downloadMutation = useMutation({
    mutationFn: () => adminService.downloadMarketReport(),
  });

  const filteredRoles = useMemo(() => {
    return roles.filter((role: any) => {
      const matchesSearch =
        role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClient = clientFilter === 'All Clients' || role.client === clientFilter;

      return matchesSearch && matchesClient;
    });
  }, [roles, searchQuery, clientFilter]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, clientFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
  const paginatedRoles = filteredRoles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const clients = useMemo(() => {
    const uniqueClients = Array.from(new Set(roles.map((r: any) => r.client)));
    return ['All Clients', ...uniqueClients];
  }, [roles]);

  const handleSaveRole = async (roleData: any) => {
    if (editingRole) {
      await updateMutation.mutateAsync({ id: editingRole.id, data: roleData });
    } else {
      await createMutation.mutateAsync(roleData);
    }
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setIsDialogOpen(true);
    setActiveMenu(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this mandate?')) {
      deleteMutation.mutate(id);
      setActiveMenu(null);
    }
  };

  const toggleApplicants = (roleId: string) => {
    setExpandedApplicantRoles((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
    );
  };

  const openCandidateSheet = (role: any) => {
    setSelectedRoleForCandidates(role);
    setIsCandidateSheetOpen(true);
  };

  const openCandidateForm = (role: any) => {
    setSelectedRoleForCandidates(role);
    setIsCandidateFormOpen(true);
    setIsCandidateSheetOpen(false);
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-role-menu-root="true"]')) {
        return;
      }

      setActiveMenu(null);
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  const loading = rolesLoading || statsLoading;

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loader message="Loading Roles Catalog..." />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tighter mb-2">Roles Catalog</h1>
          <p className="text-on-surface-variant font-medium">Manage active mandates and architectural opportunities.</p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setIsDialogOpen(true);
          }}
          className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary-container transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Create New Mandate
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl editorial-shadow border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles, clients, or locations..."
            className="w-full bg-slate-50 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors">
            <Filter size={16} /> Filters
          </button>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="bg-slate-50 border-none text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg text-slate-600"
          >
            {clients.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Roles Table - Desktop/Tablet */}
      <div className="hidden lg:block bg-white rounded-2xl editorial-shadow border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-8 py-4">Role Title & Client</th>
                <th className="px-8 py-4">Location & Salary</th>
                <th className="px-8 py-4">Expertise Required</th>
                <th className="px-8 py-4">Pipeline Status</th>
                <th className="px-8 py-4">Status & Applicants</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-400">Loading catalog...</td></tr>
              ) : filteredRoles.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-400">No mandates found matching your criteria.</td></tr>
              ) : paginatedRoles.map((role: any, i: number) => (
                <React.Fragment key={role.id || i}>
                  <tr className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <Briefcase size={20} />
                        </div>
                        <div className="w-full min-w-0">
                          <p className="text-base font-bold text-primary leading-tight">{role.title}</p>
                          <p className="text-xs text-slate-400 font-medium">{role.client}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-primary flex items-center gap-1.5"><MapPin size={12} className="text-secondary" /> {role.location}</p>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><IndianRupee size={12} className="text-secondary" /> {formatRupeeAmount(role.salary)}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1.5">
                        {role.expertise.map((exp: string, j: number) => (
                          <span key={j} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-widest">
                            {exp}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                          <div
                            className="h-full bg-secondary rounded-full"
                            style={{ width: `${(parseInt(role.headcount.split('/')[0]) / parseInt(role.headcount.split('/')[1])) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-primary">{role.headcount}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex",
                          role.status === 'Open' ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" :
                            role.status === 'Hold' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {role.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === role.id ? null : role.id)}
                        data-role-menu-root="true"
                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeMenu === role.id && (
                        <div data-role-menu-root="true" className="absolute right-8 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2">
                          <button
                            onClick={() => handleEdit(role)}
                            className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit2 size={14} /> Edit Mandate
                          </button>
                          <button
                            onClick={() => navigate(`/admin/schedule?roleId=${role.id}`)}
                            className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Calendar size={14} /> Schedule Meeting
                          </button>
                          <button
                            onClick={() => handleDelete(role.id)}
                            className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Delete Mandate
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td colSpan={6} className="px-8 pb-6 pt-0">
                      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Applied Candidates</p>
                            <p className="mt-1 text-sm font-bold text-primary">{role.appliedCandidates || 0} candidate{role.appliedCandidates === 1 ? '' : 's'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openCandidateSheet(role)}
                              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-primary-container"
                            >
                              <PlusCircle size={14} />
                              Add Candidate
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleApplicants(role.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100"
                            >
                              {expandedApplicantRoles.includes(role.id) ? 'Hide List' : 'Show List'}
                              {expandedApplicantRoles.includes(role.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>
                        <AnimatePresence initial={false}>
                          {expandedApplicantRoles.includes(role.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              {role.appliedCandidateDetails?.length > 0 ? (
                                <div className="space-y-3 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.92))] px-4 py-4">
                                  {role.appliedCandidateDetails.map((candidate: any) => (
                                    <button
                                      key={candidate.id}
                                      type="button"
                                      onClick={() => setSelectedCandidateId(candidate.id)}
                                      className="grid w-full gap-3 rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,white_55%,#eef6f6)] px-5 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-md md:grid-cols-[1.1fr_1.2fr_0.9fr_0.8fr]"
                                    >
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-primary">
                                          {candidate.name}
                                        </p>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                          ({candidate.status})
                                        </span>
                                      </div>
                                      <p className="text-xs font-medium text-slate-600 break-all">{candidate.email || 'N/A'}</p>
                                      <p className="text-xs font-medium text-slate-600">{candidate.phone || 'N/A'}</p>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary md:text-right">View Details</p>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.92))] px-5 py-5 text-sm font-medium text-slate-400">
                                  No candidates have applied to this role yet.
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <div className="p-5 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {paginatedRoles.length} of {filteredRoles.length} roles</p>
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

      {/* Role Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {paginatedRoles.map((role: any, i: number) => (
          <div key={role.id || i} className="bg-white p-6 rounded-2xl editorial-shadow border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-primary">
                  <Briefcase size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-primary leading-tight">{role.title}</p>
                  <p className="text-xs text-slate-400 font-medium">{role.client}</p>
                </div>
              </div>
              <div className="relative" data-role-menu-root="true">
                <button
                  onClick={() => setActiveMenu(activeMenu === role.id ? null : role.id)}
                  className="p-2 text-slate-400"
                >
                  <MoreVertical size={18} />
                </button>
                {activeMenu === role.id && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2">
                    <button
                      onClick={() => handleEdit(role)}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit2 size={14} /> Edit Mandate
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete Mandate
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                <p className="text-xs font-bold text-primary">{role.location}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest inline-block",
                  role.status === 'Open' ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-slate-100 text-slate-500"
                )}>
                  {role.status}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Applied Candidates</p>
                  <p className="text-xs font-bold text-primary">{role.appliedCandidates || 0}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openCandidateSheet(role)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-primary-container"
                >
                  <PlusCircle size={14} />
                  Add
                </button>
              </div>
              {role.appliedCandidateDetails?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {role.appliedCandidateDetails.map((candidate: any) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left hover:border-secondary/30 hover:bg-secondary/5"
                    >
                      <p className="text-xs font-bold text-primary">{candidate.name}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{candidate.email || 'N/A'}</p>
                      <p className="text-[11px] text-slate-500">{candidate.phone || 'N/A'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {role.expertise.slice(0, 3).map((exp: string, j: number) => (
                <span key={j} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest">
                  {exp}
                </span>
              ))}
              {role.expertise.length > 3 && (
                <span className="text-[9px] font-bold text-slate-400">+{role.expertise.length - 3} more</span>
              )}
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pipeline</span>
                <span className="text-xs font-bold text-primary">{role.headcount}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full"
                  style={{ width: `${(parseInt(role.headcount.split('/')[0]) / parseInt(role.headcount.split('/')[1])) * 100}%` }}
                />
              </div>
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

      {/* Role Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl editorial-shadow border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-primary tracking-tight">Mandate Velocity</h3>
            <Activity className="text-secondary" size={20} />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(stats?.velocityData || [40, 65, 45, 80, 55, 90, 70]).map((h: number, i: number) => ({
                  name: `W${i + 1}`,
                  value: h
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                >
                  {(stats?.velocityData || [40, 65, 45, 80, 55, 90, 70]).map((_: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? '#002045' : '#13696a'}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-primary text-white p-8 rounded-2xl editorial-shadow flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight mb-2">Market Intelligence</h3>
            <div className="space-y-4 mt-6">
              {(stats?.marketTrends || []).map((trend: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trend.label}</span>
                    <span className="text-[10px] font-bold text-secondary">{trend.growth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-300">{trend.status}</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: trend.growth.replace('+', '') }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-300">Avg. Time to Fill</span>
              <span className="font-bold">{stats?.timeToHireReduction || "..."} Days</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-300">Active Mandates</span>
              <span className="font-bold">{stats?.openRoles || "..."}</span>
            </div>
            <button
              onClick={() => downloadMutation.mutate()}
              disabled={downloadMutation.isPending}
              className="w-full mt-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              {downloadMutation.isPending ? 'Downloading...' : <><Download size={14} /> Download Market Report</>}
            </button>
          </div>
        </div>
      </div>

      <RoleDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingRole(null);
        }}
        onSave={handleSaveRole}
        initialData={editingRole}
      />
      <CandidateProfileDialog
        isOpen={Boolean(selectedCandidateId)}
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
      />
      <RoleCandidateSheet
        isOpen={isCandidateSheetOpen}
        onClose={() => setIsCandidateSheetOpen(false)}
        role={selectedRoleForCandidates}
        onAddCandidate={() => openCandidateForm(selectedRoleForCandidates)}
      />
      <CandidateFormDialog
        isOpen={isCandidateFormOpen}
        onClose={() => setIsCandidateFormOpen(false)}
        roleContext={selectedRoleForCandidates ? {
          roleId: selectedRoleForCandidates.id,
          roleTitle: selectedRoleForCandidates.title,
          roleLocation: selectedRoleForCandidates.location
        } : null}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
          queryClient.invalidateQueries({ queryKey: ['candidates'] });
          setIsCandidateFormOpen(false);
        }}
      />
    </div>
  );
};
