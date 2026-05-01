import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Briefcase, MapPin, DollarSign, Tag, Check, AlertCircle, Copy, Link2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Loader } from './Loader';
import { SearchableSelect } from './SearchableSelect';
const RequiredMark = () => <span className="ml-1 text-error">*</span>;

const ROLE_STATUS_OPTIONS = [
  { label: 'Open', value: 'Open' },
  { label: 'Hold', value: 'Hold' },
  { label: 'Closed', value: 'Closed' },
];

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: any) => Promise<void>;
  initialData?: any;
}

export const RoleDialog = ({ isOpen, onClose, onSave, initialData }: RoleDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    location: '',
    salary: '',
    experienceType: '',
    expertise: [] as string[],
    headcount: '0/1',
    status: 'Open',
    description: ''
  });

  const [expertiseInput, setExpertiseInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRoleId, setSavedRoleId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const normalizeExpertise = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  const mergeExpertise = (existing: string[], incoming: string) => {
    const nextItems = normalizeExpertise(incoming);
    if (nextItems.length === 0) {
      return existing;
    }

    return Array.from(new Set([...existing, ...nextItems]));
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        client: initialData.client || '',
        location: initialData.location || '',
        salary: initialData.salary || '',
        experienceType: initialData.experienceType || '',
        expertise: normalizeExpertise(initialData.expertise),
        headcount: initialData.headcount || '0/1',
        status: initialData.status || 'Open',
        description: initialData.description || ''
      });
      setExpertiseInput('');
    } else {
      setFormData({
        title: '',
        client: '',
        location: '',
        salary: '',
        experienceType: '',
        expertise: [],
        headcount: '0/1',
        status: 'Open',
        description: ''
      });
      setExpertiseInput('');
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset success state when dialog closes
      setSavedRoleId(null);
      setCopiedLink(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const commitExpertiseInput = (value = expertiseInput) => {
    if (!value.trim()) {
      return;
    }

    setFormData((current) => ({
      ...current,
      expertise: mergeExpertise(current.expertise, value)
    }));
    setExpertiseInput('');
  };

  const handleAddExpertise = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && expertiseInput.trim()) {
      e.preventDefault();
      commitExpertiseInput(expertiseInput);
    }
  };

  const removeExpertise = (tag: string) => {
    setFormData({
      ...formData,
      expertise: formData.expertise.filter(t => t !== tag)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      ...formData,
      expertise: mergeExpertise(formData.expertise, expertiseInput)
    };

    try {
      const result = await onSave(payload);
      // Show success state with role ID for Copy Job Link
      const roleId = (result as any)?.id || (initialData?.id ?? null);
      setSavedRoleId(roleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyJobLink = () => {
    if (!savedRoleId) return;
    const link = `${window.location.origin}/roles/${savedRoleId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleClose = () => {
    setSavedRoleId(null);
    setCopiedLink(false);
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {isSubmitting && (
                <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                  <Loader message="Saving Mandate..." />
                </div>
              )}

              {/* Header */}
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-primary tracking-tighter">
                    {savedRoleId ? 'Mandate Saved!' : (initialData ? 'Edit Mandate' : 'Create New Mandate')}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {savedRoleId ? 'Share or close this dialog' : 'Define the architectural opportunity'}
                  </p>
                </div>
                <button 
                  onClick={handleClose}
                  className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-primary"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                {/* ── Success State ── */}
                {savedRoleId ? (
                  <div className="py-8 flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-tertiary-fixed flex items-center justify-center">
                      <Check size={36} className="text-on-tertiary-fixed-variant" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-primary tracking-tighter mb-2">Mandate Created Successfully!</h3>
                      <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                        The role is now live. Share the job link so candidates can find and apply directly.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                      <button
                        onClick={handleCopyJobLink}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all',
                          copiedLink
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                            : 'bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/20'
                        )}
                      >
                        {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                        {copiedLink ? 'Copied!' : 'Copy Job Link'}
                      </button>
                      <button
                        onClick={handleClose}
                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary-container transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Title<RequiredMark /></label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          required
                          type="text" 
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                          placeholder="Senior Project Architect"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Name<RequiredMark /></label>
                      <input 
                        required
                        type="text" 
                        value={formData.client}
                        onChange={(e) => setFormData({...formData, client: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                        placeholder="Foster + Partners"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location<RequiredMark /></label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          required
                          type="text" 
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                          placeholder="New York, NY"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salary Range<RequiredMark /></label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          required
                          type="text" 
                          value={formData.salary}
                          onChange={(e) => setFormData({...formData, salary: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                          placeholder="$140k - $185k"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Headcount (Filled/Total)<RequiredMark /></label>
                      <input 
                        required
                        type="text" 
                        value={formData.headcount}
                        onChange={(e) => setFormData({...formData, headcount: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                        placeholder="0/1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                      <SearchableSelect
                        options={ROLE_STATUS_OPTIONS}
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val })}
                        placeholder="Select status..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience Required</label>
                    <input
                      type="text"
                      value={formData.experienceType}
                      onChange={(e) => setFormData({...formData, experienceType: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                      placeholder="e.g. 3+ years, Fresher, 5-10 years"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expertise Required (Press Enter or Comma)</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={expertiseInput}
                        onChange={(e) => setExpertiseInput(e.target.value)}
                        onKeyDown={handleAddExpertise}
                        onBlur={commitExpertiseInput}
                        className="w-full bg-slate-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                        placeholder="Revit, BIM, Sustainable Design..."
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.expertise.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          {tag}
                          <button type="button" onClick={() => removeExpertise(tag)} className="hover:text-primary">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Description<RequiredMark /></label>
                    <textarea 
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                      placeholder="Describe the responsibilities and expectations..."
                      rows={4}
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                        isSubmitting ? "bg-slate-100 text-slate-400" : "bg-primary text-white hover:bg-primary-container shadow-lg shadow-primary/20"
                      )}
                    >
                      {isSubmitting ? "Processing..." : (
                        <>
                          {initialData ? 'Update Mandate' : 'Create Mandate'} <Check size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
