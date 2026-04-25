import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Search, UserPlus, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminService } from '../services/adminService';
import { Loader } from './Loader';

interface RoleCandidateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  role: any | null;
  onAddCandidate: () => void;
}

export const RoleCandidateSheet = ({ isOpen, onClose, role, onAddCandidate }: RoleCandidateSheetProps) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setError(null);
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['candidates', 'role-sheet'],
    queryFn: () => adminService.getCandidates(),
    enabled: isOpen,
  });

  const applyMutation = useMutation({
    mutationFn: (candidateId: string) => adminService.applyCandidateToRole(candidateId, role.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      setError(null);
      onClose();
    },
    onError: (mutationError: any) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Failed to add candidate to role');
    }
  });

  const filteredCandidates = useMemo(() => {
    const appliedCandidateIds = new Set((role?.appliedCandidateDetails || []).map((candidate: any) => String(candidate.id)));
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return candidates
      .filter((candidate: any) => !appliedCandidateIds.has(String(candidate.id)))
      .filter((candidate: any) => {
        if (!normalizedQuery) return true;

        return [candidate.name, candidate.email, candidate.role, candidate.phone, candidate.location, candidate.industry]
          .some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
      });
  }, [candidates, role, searchQuery]);

  if (!role) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[115]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              className="w-full max-w-4xl rounded-[32px] border border-slate-200 bg-white shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Add Candidate To Role</p>
                  <h3 className="mt-1 text-xl font-extrabold text-primary tracking-tight">{role.title}</h3>
                </div>
                <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-primary">
                  <X size={20} />
                </button>
              </div>

              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search candidates by name, email, role, phone, location..."
                      className="w-full rounded-xl border-none bg-slate-50 py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onAddCandidate}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-primary-container"
                  >
                    <Plus size={14} />
                    Add Candidate
                  </button>
                </div>
                {error && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    {error}
                  </div>
                )}
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                {isLoading ? (
                  <div className="flex min-h-[220px] items-center justify-center">
                    <Loader message="Loading candidates..." />
                  </div>
                ) : filteredCandidates.length > 0 ? (
                  <div className="space-y-3">
                    {filteredCandidates.map((candidate: any) => (
                      <div
                        key={candidate.id}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,white_55%,#eef6f6)] px-5 py-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-primary">{candidate.name}</p>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{candidate.status || 'Applied'}</span>
                          </div>
                          <p className="mt-1 break-all text-xs font-medium text-slate-600">{candidate.email || 'N/A'}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                            <span>{candidate.role || 'No mandate'}</span>
                            <span>{candidate.location || 'No location'}</span>
                            <span>{candidate.phone || 'No phone'}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={applyMutation.isPending}
                          onClick={() => applyMutation.mutate(candidate.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest text-primary hover:border-secondary/30 hover:bg-slate-50 disabled:opacity-60"
                        >
                          <UserPlus size={14} />
                          Add To Role
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                    <p className="text-sm font-bold text-primary">No matching candidates found in the database.</p>
                    <p className="mt-2 max-w-md text-sm text-slate-500">
                      Add a new candidate and they will be saved to the database and applied to this role automatically.
                    </p>
                    <button
                      type="button"
                      onClick={onAddCandidate}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-primary-container"
                    >
                      <Plus size={14} />
                      Add Candidate
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
