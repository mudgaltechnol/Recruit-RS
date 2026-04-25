import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Briefcase, Mail, MapPin, Phone, ShieldCheck, User, X } from 'lucide-react';
import { Loader } from './Loader';
import { SearchableSelect } from './SearchableSelect';

const EMPLOYEE_TYPE_OPTIONS = [
  { label: 'Admin', value: '1' },
  { label: 'Employee', value: '2' },
];
const EMPLOYEE_STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];
const RequiredMark = () => <span className="ml-1 text-error">*</span>;

interface EmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: any) => Promise<void>;
  initialData?: any;
}

export const EmployeeDialog = ({ isOpen, onClose, onSave, initialData }: EmployeeDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    position: '',
    mobile: '',
    address: '',
    type: 2,
    status: 'Active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '',
        position: initialData.position || '',
        mobile: initialData.mobile || '',
        address: initialData.address || '',
        type: Number(initialData.type) === 1 ? 1 : 2,
        status: initialData.status === 'Inactive' ? 'Inactive' : 'Active',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        position: '',
        mobile: '',
        address: '',
        type: 2,
        status: 'Active',
      });
    }
    setError(null);
  }, [initialData, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    console.log('[employees][dialog][submit]', formData);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('[employees][dialog][submit-error]', err);
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4 py-8 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                  <Loader message="Saving Employee..." />
                </div>
              )}

              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-primary tracking-tighter">
                    {initialData ? 'Edit Employee' : 'Add Employee'}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Manage internal employee access
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-primary"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee Name<RequiredMark /></label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                          placeholder="Priya Sharma"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address<RequiredMark /></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                          placeholder="priya@recruitrightsolutions.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {initialData ? 'Password (leave blank to keep current)' : 'Password'}
                        {!initialData && <RequiredMark />}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!initialData}
                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                        placeholder={initialData ? 'Optional' : 'Minimum 6 characters'}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                          placeholder="Senior Recruiter"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Type</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                        <div className="pl-8">
                          <SearchableSelect
                            options={EMPLOYEE_TYPE_OPTIONS}
                            value={String(formData.type)}
                            onChange={(val) => setFormData({ ...formData, type: Number(val) })}
                            placeholder="Select role type..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                      <SearchableSelect
                        options={EMPLOYEE_STATUS_OPTIONS}
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val })}
                        placeholder="Select status..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                          placeholder="+91 98XXXXXXXX"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          rows={3}
                          className="w-full bg-slate-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-secondary/20 transition-all resize-none"
                          placeholder="New Delhi, India"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-3 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-container transition-colors"
                    >
                      {initialData ? 'Update Employee' : 'Create Employee'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
