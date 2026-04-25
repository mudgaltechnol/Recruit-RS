import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
const RequiredMark = () => <span className="ml-1 text-error">*</span>;

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginDialog = ({ isOpen, onClose, onSuccess }: LoginDialogProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
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
    setIsLoading(true);
    setError(null);

    try {
      await authService.login(email, password);
      onSuccess();
      onClose();
      // Navigate to admin panel after success
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4 py-8 md:p-8">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-primary/40 backdrop-blur-sm"
          />
          
          <div className="min-h-full flex items-center justify-center relative pointer-events-none">
            {/* Dialog */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="text-primary" size={24} />
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-primary tracking-tighter mb-2">Admin Access</h2>
              <p className="text-sm text-slate-500 font-medium tracking-tight">
                Please enter your credentials to access the Recruit Right Solutions administration panel.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address<RequiredMark /></label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@recruitrightsolutions.com"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-medium transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Password<RequiredMark /></label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-medium transition-all outline-none"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-error-container text-on-error-container rounded-2xl text-xs font-bold flex items-center gap-3 border border-error/10"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary-container transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In to Admin'
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-50 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Restricted Access Area
              </p>
            </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
