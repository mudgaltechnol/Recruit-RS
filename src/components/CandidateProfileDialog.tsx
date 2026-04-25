import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, ExternalLink, FileText, Mail, MapPin, Phone, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { adminService } from '../services/adminService';
import { Loader } from './Loader';
import { IS_PROD } from '../config';
import { cn, formatRupeeAmount } from '@/src/lib/utils';

interface CandidateProfileDialogProps {
  candidateId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateProfileDialog = ({ candidateId, isOpen, onClose }: CandidateProfileDialogProps) => {
  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', candidateId, 'dialog'],
    queryFn: () => adminService.getCandidateById(candidateId!),
    enabled: isOpen && !!candidateId,
  });
  const resumeUrl = candidate?.resumeUrl || '';
  const { data: resumeAccess, isLoading: isResumeAccessLoading } = useQuery({
    queryKey: ['candidate', candidateId, 'resume-access', resumeUrl],
    queryFn: () => adminService.getCandidateResumeAccess(candidateId!),
    enabled: isOpen && !!candidateId && !!resumeUrl && IS_PROD,
    staleTime: 4 * 60 * 1000,
  });
  const resolvedResumeUrl = IS_PROD ? (resumeAccess?.url || '') : resumeUrl;
  const isPdfResume = typeof resumeUrl === 'string' && /\.pdf($|\?)/i.test(resumeUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] overflow-y-auto p-4 py-8 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="relative min-h-full flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-6xl rounded-3xl bg-white shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc,white_55%,#eef6f6)] px-6 py-5">
                <div>
                  <h2 className="text-xl font-extrabold text-primary tracking-tight">Candidate Details</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Application profile</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white hover:text-primary"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 md:p-8">
                {isLoading ? (
                  <div className="flex min-h-[280px] items-center justify-center">
                    <Loader message="Loading Candidate..." />
                  </div>
                ) : !candidate ? (
                  <div className="py-16 text-center text-sm font-medium text-slate-400">Candidate not found.</div>
                ) : (
                  <div className="grid gap-8 xl:grid-cols-[1.05fr_1.35fr]">
                    <div className="space-y-6">
                      <div className="rounded-[28px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff,rgba(241,245,249,0.9))] p-6 shadow-sm">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-4">
                            <img
                              src={candidate.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name || 'C')}&background=random`}
                              alt={candidate.name}
                              className="h-20 w-20 rounded-2xl object-cover border border-slate-100 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h3 className="text-2xl font-black tracking-tighter text-primary">{candidate.name}</h3>
                              <p className="text-sm font-medium text-slate-500">{candidate.role}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 text-left sm:items-end sm:text-right">
                            <span className={cn(
                              "inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                              candidate.status === 'Applied' ? "bg-secondary-container text-on-secondary-container" :
                              candidate.status === 'Interviewing' ? "bg-amber-100 text-amber-700" :
                              candidate.status === 'Selected' || candidate.status === 'Placed' ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" :
                              "bg-slate-100 text-slate-500"
                            )}>
                              {candidate.status || 'Applied'}
                            </span>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Applied {candidate.appliedDate || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3">
                          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
                            <Mail size={15} className="text-secondary" />
                            <span className="break-all">{candidate.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
                            <Phone size={15} className="text-secondary" />
                            <span>{candidate.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
                            <MapPin size={15} className="text-secondary" />
                            <span>{candidate.location || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Experience</p>
                          <p className="mt-2 text-sm font-bold text-primary">{candidate.experience || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Industry</p>
                          <p className="mt-2 text-sm font-bold text-primary">{candidate.industry || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Preferred Location</p>
                          <p className="mt-2 text-sm font-bold text-primary">{candidate.preferredLocation || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expected Salary</p>
                          <p className="mt-2 text-sm font-bold text-primary">{formatRupeeAmount(candidate.expectedSalary) || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 sm:col-span-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Portfolio</p>
                          {candidate.portfolio ? (
                            <a
                              href={candidate.portfolio}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-secondary hover:underline"
                            >
                              <ExternalLink size={14} />
                              {candidate.portfolio}
                            </a>
                          ) : (
                            <p className="mt-2 text-sm font-bold text-primary">N/A</p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-100 p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Summary</p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">{candidate.summary || 'No summary available.'}</p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message</p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">{candidate.message || 'No message submitted.'}</p>
                      </div>

                      {Array.isArray(candidate.skills) && candidate.skills.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Skills</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {candidate.skills.map((skill: string, index: number) => (
                              <span
                                key={`${skill}-${index}`}
                                className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resume Preview</p>
                          <p className="mt-1 text-sm font-bold text-primary">{resumeUrl ? 'Candidate resume attached' : 'No resume uploaded'}</p>
                        </div>
                        {resolvedResumeUrl && (
                          <div className="flex gap-2">
                            <a
                              href={resolvedResumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                            >
                              <ExternalLink size={14} />
                              Open
                            </a>
                            <a
                              href={resolvedResumeUrl}
                              download
                              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-primary-container"
                            >
                              <Download size={14} />
                              Download
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="min-h-[520px] overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50">
                        {resumeUrl ? (
                          isResumeAccessLoading && IS_PROD ? (
                            <div className="flex h-[520px] items-center justify-center bg-white">
                              <Loader message="Securing Resume..." />
                            </div>
                          ) : resolvedResumeUrl ? (
                          isPdfResume ? (
                            <iframe
                              src={resolvedResumeUrl}
                              title={`${candidate.name} resume`}
                              className="h-[520px] w-full bg-white"
                            />
                          ) : (
                            <div className="flex h-[520px] flex-col items-center justify-center gap-4 px-6 text-center">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-secondary shadow-sm">
                                <FileText size={28} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-primary">Resume preview is available for PDF files only.</p>
                                <p className="mt-2 text-sm text-slate-500">Open or download the uploaded resume to view it.</p>
                              </div>
                            </div>
                          )
                          ) : (
                            <div className="flex h-[520px] flex-col items-center justify-center gap-4 px-6 text-center">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                                <FileText size={28} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-primary">Resume access is unavailable.</p>
                                <p className="mt-2 text-sm text-slate-500">The signed resume link could not be generated.</p>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="flex h-[520px] flex-col items-center justify-center gap-4 px-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                              <FileText size={28} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary">No resume on file.</p>
                              <p className="mt-2 text-sm text-slate-500">This candidate has not uploaded a resume yet.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
