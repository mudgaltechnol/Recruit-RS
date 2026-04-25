import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Mail,
  Calendar, 
  BarChart3, 
  Plus, 
  HelpCircle, 
  LogOut,
  Search as SearchIcon,
  Bell,
  MessageSquare,
  Settings,
  Menu,
  X,
  ChevronRight,
  User,
  FileText,
  Zap
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { authService, isAdminUser } from '../services/authService';
import { adminService } from '../services/adminService';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from './BrandLogo';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  key?: string;
}

const SidebarItem = ({ icon, label, href, active }: SidebarItemProps) => (
  <Link 
    to={href}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-white dark:bg-slate-900 text-primary dark:text-teal-400 shadow-sm" 
        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
    )}
  >
    <span className={cn("transition-colors", active ? "text-primary dark:text-teal-400" : "text-slate-500")}>
      {icon}
    </span>
    <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
  </Link>
);

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ candidates: any[], roles: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const user = authService.getCurrentUser();
  const isAdmin = isAdminUser(user);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setIsSearching(true);
        try {
          const results = await adminService.search(searchQuery);
          setSearchResults(results);
          setShowSearchResults(true);
        } catch (error) {
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const navItems = [
    { icon: <Zap size={20} />, label: "Intelligence", href: "/admin/intelligence" },
    { icon: <Users size={20} />, label: "Talent Pool", href: "/admin/candidates" },
    { icon: <Briefcase size={20} />, label: "Roles Catalog", href: "/admin/roles" },
    { icon: <Mail size={20} />, label: "Newsletter", href: "/admin/newsletter" },
    { icon: <Calendar size={20} />, label: "Schedule", href: "/admin/schedule" },
    { icon: <User size={20} />, label: "Employees", href: "/admin/employees" },
    { icon: <BarChart3 size={20} />, label: "Reports", href: "/admin/reports" },
  ].filter((item) => {
    if (isAdmin) return true;

    return !["Intelligence", "Newsletter", "Reports", "Employees"].includes(item.label);
  });

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar - Desktop */}
      <aside className="hidden xl:flex flex-col w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200/20 fixed inset-y-0 left-0 p-4 z-50 overflow-y-auto scrollbar-hide">
        <div className="mb-8 px-2">
          <Link to="/" className="mb-1 block">
            <BrandLogo className="min-w-0" imgClassName="h-14 max-w-[72px]" textClassName="text-lg text-white" />
          </Link>
        </div>

        <div className="mb-4 px-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Tools</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <SidebarItem 
                key={item.href} 
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={location.pathname === item.href} 
              />
            ))}
          </nav>
        </div>

        {isAdmin && (
          <div className="px-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Public Facing</p>
            <nav className="space-y-1">
              <SidebarItem 
                icon={<LayoutDashboard size={20} />} 
                label="Intelligence" 
                href="/intelligence" 
                active={location.pathname === "/intelligence"}
              />
            </nav>
          </div>
        )}

        <div className="mt-auto pt-6 space-y-1">
          <button 
            onClick={() => navigate('/admin/candidates?add=true')}
            className="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold text-sm mb-6 shadow-lg shadow-primary/20 hover:bg-primary-container transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add New Candidate
          </button>
          <SidebarItem icon={<HelpCircle size={20} />} label="Help Center" href="/admin/help" />
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 group"
          >
            <LogOut size={20} className="text-slate-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 xl:ml-64 flex flex-col">
        {/* Top Nav */}
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button 
              className="xl:hidden p-2 text-slate-500"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="relative w-full hidden md:block" ref={searchRef}>
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search talent, roles, or clients..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length > 1 && setShowSearchResults(true)}
                className="w-full bg-surface-container-highest border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
              />
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearchResults && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                  >
                    {isSearching ? (
                      <div className="p-8 text-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Searching...</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {searchResults?.candidates.length === 0 && searchResults?.roles.length === 0 ? (
                          <div className="p-8 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No results found</p>
                          </div>
                        ) : (
                          <>
                            {searchResults?.candidates && searchResults.candidates.length > 0 && (
                              <div className="mb-2">
                                <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidates</p>
                                {searchResults.candidates.map((candidate) => (
                                  <Link 
                                    key={candidate.id}
                                    to={`/admin/candidates/${candidate.id}`}
                                    onClick={() => setShowSearchResults(false)}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors group"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden">
                                      <img src={candidate.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-primary group-hover:text-secondary transition-colors">{candidate.name}</p>
                                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{candidate.role}</p>
                                    </div>
                                    <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-primary transition-colors" />
                                  </Link>
                                ))}
                              </div>
                            )}
                            
                            {searchResults?.roles && searchResults.roles.length > 0 && (
                              <div>
                                <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Roles</p>
                                {searchResults.roles.map((role) => (
                                  <Link 
                                    key={role.id}
                                    to={`/admin/roles`}
                                    onClick={() => setShowSearchResults(false)}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors group"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                      <Briefcase size={20} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-primary group-hover:text-secondary transition-colors">{role.title}</p>
                                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{role.client}</p>
                                    </div>
                                    <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-primary transition-colors" />
                                  </Link>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell size={20} className="text-slate-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <MessageSquare size={20} className="text-slate-500" />
            </button>
            <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-primary leading-none">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] text-secondary font-medium uppercase tracking-tighter">{isAdmin ? 'System Administrator' : 'Senior Recruiter'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-black border-2 border-primary-container/20">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8 bg-surface-container-low min-h-[calc(100vh-64px)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full py-12 border-t border-slate-200 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 max-w-7xl mx-auto">
            <div className="space-y-4">
              <BrandLogo imgClassName="h-12" textClassName="text-lg text-primary dark:text-white" />
              <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-widest">
                Advanced recruitment infrastructure for modern staffing agencies.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-primary font-bold">Resources</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-slate-500 uppercase tracking-widest hover:underline">Help Center</a></li>
                <li><a href="#" className="text-xs text-slate-500 uppercase tracking-widest hover:underline">API Documentation</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-primary font-bold">Privacy</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-slate-500 uppercase tracking-widest hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="text-xs text-slate-500 uppercase tracking-widest hover:underline">Terms of Service</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-primary font-bold">Contact</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">support@nexus-talent.hq</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-8 mt-12 pt-8 border-t border-slate-200/50 flex justify-between items-center">
            <p className="text-xs uppercase tracking-widest text-slate-400">© 2024 Recruit Right Solutions. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 xl:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="w-64 h-full bg-slate-50 p-4 flex flex-col overflow-y-auto scrollbar-hide" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <BrandLogo imgClassName="h-10 max-w-[56px]" textClassName="text-base text-white" />
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            
            <div className="mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-4">Internal Tools</p>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <SidebarItem 
                    key={item.href} 
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    active={location.pathname === item.href} 
                  />
                ))}
              </nav>
            </div>

            {isAdmin && (
              <div className="mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-4">Public Facing</p>
                <nav className="space-y-1">
                  <SidebarItem 
                    icon={<LayoutDashboard size={20} />} 
                    label="Intelligence" 
                    href="/intelligence" 
                    active={location.pathname === "/intelligence"}
                  />
                </nav>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
