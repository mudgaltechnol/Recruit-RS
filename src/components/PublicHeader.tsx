import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Menu, X, Briefcase, CloudUpload, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { LoginDialog } from './LoginDialog';
import { authService } from '../services/authService';
import { BrandLogo } from './BrandLogo';

interface PublicHeaderProps {
  onApply: () => void;
  activePage?: 'home' | 'positions' | 'admin';
}

export const PublicHeader = ({ onApply, activePage }: PublicHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (authService.isAuthenticated()) {
      navigate('/admin/candidates');
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <nav className="flex justify-between items-center px-6 md:px-8 py-4 max-w-7xl mx-auto">
          <Link to="/" className="shrink-0">
            <BrandLogo className="min-w-0" imgClassName="h-10 md:h-14" textClassName="max-w-[140px] text-xs leading-snug md:max-w-none md:text-2xl" />
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden xl:flex space-x-8 font-bold tracking-tight items-center">
            <Link 
              to="/" 
              className={cn(
                "transition-colors hover:text-secondary",
                activePage === 'home' ? "text-blue-900 border-b-2 border-secondary pb-1" : "text-slate-600"
              )}
            >
              Home
            </Link>
            <Link
              to="/positions"
              className={cn(
                "transition-colors hover:text-secondary",
                activePage === 'positions' ? "text-blue-900 border-b-2 border-secondary pb-1" : "text-slate-600"
              )}
            >
              Roles
            </Link>
            <button 
              onClick={handleAdminClick}
              className={cn(
                "transition-colors hover:text-secondary flex items-center gap-1 font-bold tracking-tight",
                activePage === 'admin' ? "text-blue-900 border-b-2 border-secondary pb-1" : "text-slate-600"
              )}
            >
              <Lock size={14} className={activePage === 'admin' ? "text-secondary" : "text-slate-400"} /> Admin
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={onApply}
              className="hidden md:block bg-primary text-white px-4 md:px-6 py-2.5 rounded-lg font-headline font-bold hover:bg-primary-container transition-all text-sm md:text-base whitespace-nowrap"
            >
              Submit Resume
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="xl:hidden p-2 text-primary hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden bg-white border-t border-slate-100 overflow-hidden shadow-xl"
            >
              <div className="flex flex-col p-6 space-y-4 font-bold tracking-tight">
                <Link 
                  to="/" 
                  className={cn(
                    "py-3 border-b border-slate-50 flex items-center gap-3",
                    activePage === 'home' ? "text-blue-900" : "text-slate-600"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Activity size={18} className={activePage === 'home' ? "text-blue-900" : "text-slate-400"} />
                  </span>
                  Home
                </Link>
                <Link
                  to="/positions"
                  className={cn(
                    "py-3 border-b border-slate-50 flex items-center gap-3",
                    activePage === 'positions' ? "text-blue-900" : "text-slate-600 hover:text-secondary"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Briefcase size={18} className={activePage === 'positions' ? "text-blue-900" : "text-slate-400"} />
                  </span>
                  Roles
                </Link>
                <button 
                  onClick={(e) => {
                    handleAdminClick(e);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "py-3 border-b border-slate-50 flex items-center gap-3 w-full text-left font-bold tracking-tight",
                    activePage === 'admin' ? "text-blue-900" : "text-slate-600"
                  )}
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Lock size={18} className={activePage === 'admin' ? "text-blue-900" : "text-slate-400"} />
                  </span>
                  Admin
                </button>
                <button 
                  onClick={() => {
                    onApply();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary text-white py-4 rounded-xl font-headline font-bold hover:bg-primary-container transition-all mt-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <CloudUpload size={20} />
                  Submit Resume
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <LoginDialog 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onSuccess={() => {
          // Success is handled inside LoginDialog by navigating
        }}
      />
    </>
  );
};
