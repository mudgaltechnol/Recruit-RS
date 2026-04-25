import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle2, Briefcase, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ApplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole?: string;
  roles?: any[];
}

import { publicService } from '../services/publicService';
import { Loader } from './Loader';
import { SearchableSelect } from './SearchableSelect';

const INDUSTRY_OPTIONS = ['Civil', 'IT', 'FMCG', 'Internet/Product', 'BFSI', 'Others'] as const;
const INDUSTRY_SELECT_OPTIONS = [{ label: 'Select industry...', value: '' }, ...INDUSTRY_OPTIONS.map(i => ({ label: i, value: i }))];
const OTHER_MANDATE_VALUE = '__other_mandate__';
const RequiredMark = () => <span className="ml-1 text-error">*</span>;

export const ApplyDialog = ({ isOpen, onClose, selectedRole, roles = [] }: ApplyDialogProps) => {
  const selectedRoleData = selectedRole ? roles.find((role) => role.id === selectedRole) : null;
  const isRoleLocked = Boolean(selectedRoleData);

  const createInitialFormData = (roleId = selectedRole || '') => ({
    name: '',
    email: '',
    roleId,
    role: '',
    otherMandate: '',
    industry: '',
    experience: '',
    location: selectedRoleData?.location || '',
    preferredLocation: '',
    phone: '',
    summary: '',
    portfolio: '',
    message: selectedRoleData
      ? `Applying for ${selectedRoleData.title} at ${selectedRoleData.client}.`
      : ''
  });

  const [formData, setFormData] = useState({
    ...createInitialFormData()
  });
  const hasRoles = roles.length > 0;
  const activeRoleData = formData.roleId && formData.roleId !== OTHER_MANDATE_VALUE
    ? roles.find((role) => role.id === formData.roleId)
    : null;
  const shouldShowOtherMandateField = !isRoleLocked && hasRoles && formData.roleId === OTHER_MANDATE_VALUE;

  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormData(selectedRole || ''));
      setResume(null);
      setSubmitError(null);
      setIsSuccess(false);
    }
  }, [selectedRole, selectedRoleData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const [resume, setResume] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!resume) {
      alert('Resume is required.');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        roleId: formData.roleId === OTHER_MANDATE_VALUE ? '' : formData.roleId,
        role: formData.roleId === OTHER_MANDATE_VALUE ? formData.otherMandate : formData.role
      };

      // Step 1: Submit application data
      const result = await publicService.apply(payload);

      if (result.success && result.id) {
        // Step 2: Upload resume if selected
        if (resume) {
          try {
            await publicService.uploadResume(result.id, resume);
          } catch (uploadError) {
            console.error("Resume upload failed", uploadError);
            setSubmitError(uploadError instanceof Error ? uploadError.message : 'Failed to upload resume');
            return;
          }
        }

        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setFormData(createInitialFormData());
          setResume(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Submission failed", error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitError(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4 py-8 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="min-h-full flex items-center justify-center relative pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-extrabold text-primary tracking-tight">Add New Candidate</h2>
                <button 
                  onClick={handleClose}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

            <div className="p-6">
              {isSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-primary tracking-tight">Application Received</h3>
                  <p className="text-on-surface-variant max-w-xs mx-auto">
                    Our curators will review your credentials and contact you within 48 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {selectedRoleData && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Applying To</p>
                      <p className="mt-1 text-sm font-bold text-primary">{selectedRoleData.title}</p>
                      <p className="text-xs font-medium text-slate-500">
                        {selectedRoleData.client} • {selectedRoleData.location}
                      </p>
                    </div>
                  )}
                  {submitError && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                      {submitError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name<RequiredMark /></label>
                        <input 
                          required
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                          disabled={isSubmitting}
                          placeholder="John Doe"
                        />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address<RequiredMark /></label>
                        <input 
                          required
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                          disabled={isSubmitting}
                          placeholder="john@example.com"
                        />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {hasRoles ? 'Role' : 'Mandate'}
                        <RequiredMark />
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        {hasRoles ? (
                          <div className="pl-8">
                            <SearchableSelect
                              options={[
                                { label: 'Choose a mandate...', value: '' },
                                ...roles.map(role => ({ label: `${role.title} - ${role.client}`, value: role.id })),
                                { label: 'Other', value: OTHER_MANDATE_VALUE }
                              ]}
                              value={formData.roleId}
                              onChange={(nextRoleId) => {
                                const nextRole = roles.find((role) => role.id === nextRoleId);
                                setFormData({
                                  ...formData,
                                  roleId: nextRoleId,
                                  role: '',
                                  otherMandate: nextRoleId === OTHER_MANDATE_VALUE ? formData.otherMandate : '',
                                  location: nextRole?.location || formData.location
                                });
                              }}
                              disabled={isRoleLocked || isSubmitting}
                              placeholder="Choose a mandate..."
                            />
                          </div>
                        ) : (
                          <input
                            required
                            type="text"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value, roleId: '' })}
                            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10"
                            disabled={isSubmitting}
                            placeholder="Enter your mandate"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Experience (in years)<RequiredMark /></label>
                      <input
                        required
                        type="text"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                        disabled={isSubmitting}
                        placeholder="8"
                      />
                    </div>
                  </div>

                  {shouldShowOtherMandateField && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Other Mandate<RequiredMark /></label>
                      <input
                        required
                        type="text"
                        value={formData.otherMandate}
                        onChange={(e) => setFormData({ ...formData, otherMandate: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                        disabled={isSubmitting}
                        placeholder="Enter mandate"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Industry<RequiredMark /></label>
                      <SearchableSelect
                        options={INDUSTRY_SELECT_OPTIONS}
                        value={formData.industry}
                        onChange={(val) => setFormData({ ...formData, industry: val })}
                        placeholder="Select industry..."
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pref. Location<RequiredMark /></label>
                      <input
                        required
                        type="text"
                        value={formData.preferredLocation}
                        onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                        disabled={isSubmitting}
                        placeholder="Preferred location"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Location<RequiredMark /></label>
                      <input
                        required
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                        disabled={isSubmitting}
                        placeholder={activeRoleData?.location || "Current location"}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone<RequiredMark /></label>
                      <input
                        required
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                        disabled={isSubmitting}
                        placeholder="+44..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Summary</label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 resize-none"
                      disabled={isSubmitting}
                      placeholder="Brief professional summary..."
                      rows={3}
                    />
                  </div>

                  {!hasRoles && (
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      No active mandates available, so applicants can enter one manually.
                    </p>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resume<RequiredMark /></label>
                    <div className={cn(
                      "relative group cursor-pointer border-2 border-dashed rounded-xl py-4 px-4 transition-all",
                      resume ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-primary/20"
                    )}>
                      <input 
                        type="file" 
                        required
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setResume(e.target.files?.[0] || null)}
                        disabled={isSubmitting}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Upload size={20} className="text-slate-400" />
                        <span className="text-slate-500 font-medium text-sm text-center">
                          {resume ? resume.name : "Click to upload resume (PDF, DOCX)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Portfolio Link</label>
                    <input 
                      type="url" 
                      value={formData.portfolio}
                      onChange={(e) => setFormData({...formData, portfolio: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                      disabled={isSubmitting}
                      placeholder="https://behance.net/yourname"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message</label>
                    <textarea 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 resize-none"
                      disabled={isSubmitting}
                      placeholder="Tell us about your architectural philosophy..."
                      rows={3}
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
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
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )}
  </AnimatePresence>
  );
};
