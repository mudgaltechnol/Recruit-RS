import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Calendar, ChevronLeft, ChevronRight, Globe, Mail, MapPin, Phone } from 'lucide-react';

import { formatRupeeAmount } from '@/src/lib/utils';
import { ApplyDialog } from '../components/ApplyDialog';
import { Loader } from '../components/Loader';
import { BrandLogo } from '../components/BrandLogo';
import { PublicHeader } from '../components/PublicHeader';
import { publicService } from '../services/publicService';
import { cn } from '@/src/lib/utils';

export const PositionsPage = () => {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data: roles = [], isLoading, isError } = useQuery({
    queryKey: ['public-positions'],
    queryFn: () => publicService.getRoles(),
  });

  const handleApply = (roleId?: string) => {
    setSelectedRoleId(roleId);
    setIsApplyOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader message="Loading open positions..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <PublicHeader onApply={() => handleApply()} activePage="positions" />

      <main className="pt-28 pb-20 px-8">
        <section className="max-w-7xl mx-auto">
          <div className="bg-surface-container-low rounded-[2rem] p-8 md:p-12 editorial-shadow mb-10">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-4">Open Positions</p>
              <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-primary leading-none mb-6">
                Candidate-facing roles only.
              </h1>
              <p className="text-on-surface-variant text-base md:text-lg leading-relaxed mb-8">
                Browse current openings, review core details, and apply directly. This page is public and intentionally excludes internal catalog data used by the team.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-on-surface-variant">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2">
                  <Briefcase size={16} className="text-secondary" />
                  {roles.length} active roles
                </span>
              </div>
            </div>
          </div>

          {isError ? (
            <div className="rounded-3xl bg-white p-10 text-center editorial-shadow">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Unable to load open roles right now.</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center editorial-shadow">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No open roles available at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const totalPages = Math.max(1, Math.ceil(roles.length / PAGE_SIZE));
                const paginatedRoles = roles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
                return (
                  <>
                    {paginatedRoles.map((role: any) => (
                <article key={role.id} className="bg-white rounded-3xl p-8 editorial-shadow border border-slate-100">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">{role.client}</p>
                      <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary">{role.title}</h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary">
                      <Briefcase size={20} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm text-on-surface-variant">
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-3">
                      <MapPin size={16} className="text-secondary" />
                      {role.location}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-3">
                      <Calendar size={16} className="text-secondary" />
                      {Array.isArray(role.expertise) ? role.expertise.join(', ') : role.expertise}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Compensation</p>
                      <p className="font-headline text-xl font-bold text-tertiary-container">
                        {formatRupeeAmount(role.salary)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApply(role.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-container transition-colors"
                    >
                      Apply Now
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
                    ))}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors"><ChevronLeft size={18} /></button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button key={page} onClick={() => setCurrentPage(page)} className={cn("w-10 h-10 rounded-xl text-sm font-bold transition-colors", page === currentPage ? "bg-primary text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50")}>{page}</button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors"><ChevronRight size={18} /></button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </section>
      </main>

      <ApplyDialog
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        selectedRole={selectedRoleId}
        roles={roles}
      />

      <footer className="w-full py-12 border-t border-slate-200 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 max-w-7xl mx-auto">
          <div>
            <BrandLogo className="mb-6" imgClassName="h-12" textClassName="text-lg" />
            <p className="text-slate-500 text-xs uppercase tracking-widest leading-loose">
              Public job discovery and direct applications for current opportunities.
            </p>
          </div>
          <div>
            <h6 className="font-headline font-bold text-sm text-primary mb-6">Quick Links</h6>
            <ul className="space-y-4 text-slate-500 text-xs uppercase tracking-widest">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/positions" className="hover:underline">Open Positions</Link></li>
              <li><Link to="/intelligence" className="hover:underline">Market Intelligence</Link></li>
            </ul>
          </div>
          <div>
            <h6 className="font-headline font-bold text-sm text-primary mb-6">Contact</h6>
            <ul className="space-y-4 text-slate-500 text-xs tracking-widest uppercase">
              <li className="flex items-center gap-2"><Globe size={14} /> 1200 Avenue of Americas, NY</li>
              <li className="flex items-center gap-2"><Phone size={14} /> +1 212 900 8800</li>
              <li className="flex items-center gap-2"><Mail size={14} /> hello@recruitrightsolutions.com</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};
