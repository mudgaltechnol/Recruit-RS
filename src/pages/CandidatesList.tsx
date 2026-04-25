import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Download, 
  Plus,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  Check,
  AlertCircle,
  Trash2,
  Edit2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { adminService } from '../services/adminService';
import { Loader } from '../components/Loader';
import { CandidateFormDialog } from '../components/CandidateFormDialog';
import { CandidateProfileDialog } from '../components/CandidateProfileDialog';

export const CandidatesList = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-candidate-menu-root="true"]')) {
        return;
      }
      setActiveMenu(null);
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsAddModalOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('add');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => adminService.getCandidates(),
  });

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      adminService.updateCandidateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCandidate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      deleteMutation.mutate(id);
      setActiveMenu(null);
    }
  };

  const handleEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setIsAddModalOpen(true);
    setActiveMenu(null);
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c: any) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.skills && c.skills.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchTerm, statusFilter]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
  const paginatedCandidates = filteredCandidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const exportToCSV = () => {
    if (filteredCandidates.length === 0) return;
    
    const headers = ['Name', 'Email', 'Role', 'Experience', 'Location', 'Status', 'Applied Date'];
    const csvContent = [
      headers.join(','),
      ...filteredCandidates.map((c: any) => [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.role}"`,
        `"${c.experience}"`,
        `"${c.location}"`,
        `"${c.status}"`,
        `"${c.appliedDate}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `talent_pool_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loading = candidatesLoading || statsLoading;

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loader message="Loading Talent Pool..." />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tighter mb-2">Talent Pool</h1>
          <p className="text-on-surface-variant font-medium">Manage and track your curated architectural talent.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={exportToCSV}
            className="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-primary hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
          <button 
            onClick={() => {
              setEditingCandidate(null);
              setIsAddModalOpen(true);
            }}
            className="flex-1 md:flex-none bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Candidate
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl editorial-shadow border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, role, or skill..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border-none text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg text-slate-600 w-full md:w-auto"
          >
            <option>All Status</option>
            <option>Applied</option>
            <option>Interviewing</option>
            <option>Selected</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>

      {/* Table - Desktop/Tablet */}
      <div className="hidden lg:block bg-white rounded-2xl editorial-shadow border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-8 py-4">Candidate Information</th>
                <th className="px-8 py-4">Role & Experience</th>
                <th className="px-8 py-4">Contact Details</th>
                <th className="px-8 py-4">Current Status</th>
                <th className="px-8 py-4">Last Activity</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCandidates.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-400">No candidates found matching your criteria.</td></tr>
              ) : paginatedCandidates.map((candidate: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <button onClick={() => setSelectedCandidateId(candidate.id)} className="flex items-center gap-4 hover:opacity-80 transition-opacity text-left">
                      <img 
                        src={candidate.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=random`} 
                        className="w-12 h-12 rounded-xl object-cover border-2 border-slate-100" 
                        alt={candidate.name}
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-base font-bold text-primary leading-tight">{candidate.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{candidate.location}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-primary">{candidate.role}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{candidate.experience} years</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-2"><Mail size={12} /> {candidate.email}</p>
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-2"><Phone size={12} /> {candidate.phone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <select 
                      value={candidate.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: candidate.id, status: e.target.value })}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border-none focus:ring-0 cursor-pointer",
                        candidate.status === 'Selected' ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : 
                        candidate.status === 'Rejected' ? "bg-error-container text-on-error-container" :
                        "bg-secondary-container text-on-secondary-container"
                      )}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-primary">{candidate.lastUpdated || "Recently"}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">System Update</p>
                  </td>
                  <td className="px-8 py-6 text-right relative" data-candidate-menu-root="true">
                    <button onClick={() => setActiveMenu(activeMenu === candidate.id ? null : candidate.id)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                      <MoreVertical size={18} />
                    </button>
                    {activeMenu === candidate.id && (
                      <div className="absolute right-8 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2 text-left">
                        <button
                          onClick={() => handleEdit(candidate)}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit2 size={14} /> Edit Candidate
                        </button>
                        <button
                          onClick={() => handleDelete(candidate.id)}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Delete Candidate
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing {paginatedCandidates.length} of {filteredCandidates.length} candidates
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                  page === currentPage
                    ? "bg-primary text-white"
                    : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Card Grid - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {paginatedCandidates.map((candidate: any, i: number) => (
          <div key={i} className="bg-white p-6 rounded-2xl editorial-shadow border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={candidate.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=random`} 
                  className="w-12 h-12 rounded-xl object-cover border-2 border-slate-100" 
                  alt={candidate.name}
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-base font-bold text-primary leading-tight">{candidate.name}</p>
                  <p className="text-xs text-slate-400 font-medium">{candidate.location}</p>
                </div>
              </div>
              <div className="relative" data-candidate-menu-root="true">
                <button onClick={() => setActiveMenu(activeMenu === candidate.id ? null : candidate.id)} className="p-2 text-slate-400">
                  <MoreVertical size={18} />
                </button>
                {activeMenu === candidate.id && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2 text-left">
                    <button
                      onClick={() => handleEdit(candidate)}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit2 size={14} /> Edit Candidate
                    </button>
                    <button
                      onClick={() => handleDelete(candidate.id)}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete Candidate
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Role</p>
                <p className="text-xs font-bold text-primary">{candidate.role}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <select 
                  value={candidate.status}
                  onChange={(e) => updateStatusMutation.mutate({ id: candidate.id, status: e.target.value })}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest inline-block border-none focus:ring-0",
                    candidate.status === 'Selected' ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : 
                    candidate.status === 'Rejected' ? "bg-error-container text-on-error-container" :
                    "bg-secondary-container text-on-secondary-container"
                  )}
                >
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-slate-600 flex items-center gap-2"><Mail size={12} /> {candidate.email}</p>
              <p className="text-xs font-medium text-slate-600 flex items-center gap-2"><Phone size={12} /> {candidate.phone}</p>
            </div>

            <button 
              onClick={() => setSelectedCandidateId(candidate.id)}
              className="block w-full py-3 bg-slate-50 text-center rounded-xl text-xs font-bold text-primary uppercase tracking-widest hover:bg-slate-100 transition-colors"
            >
              View Full Profile
            </button>
          </div>
        ))}
        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", page === currentPage ? "bg-primary text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50")}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Talent Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary text-white p-6 rounded-2xl editorial-shadow">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Total Talent Pool</p>
          <h3 className="text-4xl font-black tracking-tighter">{stats?.activeCandidates ?? 0}</h3>
          {/* <div className="mt-4 flex items-center gap-2 text-teal-400 text-xs font-bold">
            <TrendingUp size={14} /> +12% from last month
          </div> */}
        </div>
        <div className="bg-white p-6 rounded-2xl editorial-shadow border border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Active Interviews</p>
          <h3 className="text-4xl font-black tracking-tighter text-primary">{stats?.interviewStage ?? 0}</h3>
          <p className="mt-4 text-xs font-medium text-slate-500">Across {stats?.openRoles ?? 0} different roles</p>
        </div>
        <div className="bg-white p-6 rounded-2xl editorial-shadow border border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Placement Rate</p>
          <h3 className="text-4xl font-black tracking-tighter text-primary">{stats?.selectionGoal ?? 0}%</h3>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{ width: `${stats?.selectionGoal ?? 0}%` }} />
          </div>
        </div>
      </div>
      <CandidateFormDialog
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCandidate(null);
        }}
        initialData={editingCandidate}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['candidates'] });
        }}
      />
      <CandidateProfileDialog
        isOpen={Boolean(selectedCandidateId)}
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
      />
    </div>
  );
};
