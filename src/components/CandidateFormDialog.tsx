import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Download, X } from 'lucide-react';

import { cn } from '@/src/lib/utils';
import { API_BASE_URL } from '../config';
import { Loader } from './Loader';
import { SearchableSelect } from './SearchableSelect';

const INDUSTRY_OPTIONS = ['Civil', 'IT', 'FMCG', 'Internet/Product', 'BFSI', 'Others'] as const;
const INDUSTRY_SELECT_OPTIONS = [{ label: 'Select industry...', value: '' }, ...INDUSTRY_OPTIONS.map(i => ({ label: i, value: i }))];
const RequiredMark = () => <span className="ml-1 text-error">*</span>;

interface CandidateFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (candidate: any) => void;
  roleContext?: {
    roleId: string;
    roleTitle: string;
    roleLocation?: string;
  } | null;
  initialData?: any;
}

export const CandidateFormDialog = ({ isOpen, onClose, onSuccess, roleContext, initialData }: CandidateFormDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeType, setResumeType] = useState<'link' | 'upload'>('link');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string>(initialData?.industry || '');

  useEffect(() => {
    if (!isOpen) {
      setResumeType('link');
      setSelectedFile(null);
      setError(null);
      setIsSubmitting(false);
      setIndustry('');
      return;
    }
    setIndustry(initialData?.industry || '');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const candidateData = {
        ...data,
        industry,
        roleId: roleContext?.roleId || '',
        role: roleContext?.roleTitle || String(data.role || ''),
        location: String(data.location || roleContext?.roleLocation || ''),
        resumeUrl: resumeType === 'link' ? data.resumeUrl : ''
      };

      const method = initialData ? 'PATCH' : 'POST';
      const endpoint = initialData 
        ? `${API_BASE_URL}/api/candidates/${initialData.id}` 
        : `${API_BASE_URL}/api/candidates`;

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to add candidate');
      }

      const result = await response.json();

      if (resumeType === 'upload' && selectedFile && result.id) {
        const uploadFormData = new FormData();
        uploadFormData.append('resume', selectedFile);

        const uploadResponse = await fetch(`${API_BASE_URL}/api/public/upload-resume/${result.id}`, {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload resume');
        }
      }

      onSuccess?.(result);
      onClose();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to add candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] overflow-y-auto p-4 py-8 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="min-h-full flex items-center justify-center relative pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-xl font-extrabold text-primary tracking-tight">
                    {initialData ? 'Edit Candidate' : 'Add New Candidate'}
                  </h2>
                  {roleContext && (
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Will be applied to {roleContext.roleTitle}
                    </p>
                  )}
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                    <input name="name" defaultValue={initialData?.name || ''} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address<RequiredMark /></label>
                    <input name="email" type="email" defaultValue={initialData?.email || ''} required className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" placeholder="john@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Role / Mandate
                      {!roleContext && <RequiredMark />}
                    </label>
                    <input
                      name="role"
                      required={!roleContext}
                      defaultValue={roleContext?.roleTitle || initialData?.role || ''}
                      disabled={Boolean(roleContext)}
                      className={cn(
                        "w-full border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10",
                        roleContext ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50"
                      )}
                      placeholder="Senior Architect"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Experience</label>
                    <input name="experience" defaultValue={initialData?.experience?.toString()?.replace(' Years', '') || ''} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" placeholder="8" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Location</label>
                    <input
                      name="location"
                      defaultValue={roleContext?.roleLocation || initialData?.location || ''}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                      placeholder="London, UK"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone</label>
                    <input name="phone" defaultValue={initialData?.phone || ''} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" placeholder="+44..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Industry</label>
                    <SearchableSelect
                      options={INDUSTRY_SELECT_OPTIONS}
                      value={industry}
                      onChange={setIndustry}
                      placeholder="Select industry..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pref. Location</label>
                    <input
                      name="preferredLocation"
                      defaultValue={initialData?.preferredLocation || ''}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                      placeholder="Preferred location"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Summary</label>
                  <textarea name="summary" defaultValue={initialData?.summary || ''} rows={3} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 resize-none" placeholder="Brief professional summary..." />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Portfolio Link</label>
                  <input
                    name="portfolio"
                    type="url"
                    defaultValue={initialData?.portfolio || ''}
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                    placeholder="https://behance.net/yourname"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resume</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setResumeType('link')}
                        className={cn(
                          "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                          resumeType === 'link' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setResumeType('upload')}
                        className={cn(
                          "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                          resumeType === 'upload' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Upload
                      </button>
                    </div>
                  </div>

                  {resumeType === 'link' ? (
                    <input
                      name="resumeUrl"
                      defaultValue={initialData?.resumeUrl || ''}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                      placeholder="https://link-to-resume.pdf"
                    />
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        id="candidate-form-resume-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <label
                        htmlFor="candidate-form-resume-upload"
                        className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-4 px-4 text-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 hover:border-primary/20 transition-all"
                      >
                        <Download size={20} className="text-slate-400" />
                        <span className="text-slate-500 font-medium">
                          {selectedFile ? selectedFile.name : "Click to upload resume (PDF, DOCX)"}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-container transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader size="sm" /> : <><Check size={18} /> Save Candidate</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
