import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Clock, 
  CheckCircle2,
  Star,
  Quote,
  MapPin,
  IndianRupee,
  ChevronRight,
  Globe,
  Activity,
  Mail,
  Send,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn, formatRupeeAmount } from '@/src/lib/utils';
import { ApplyDialog } from '../components/ApplyDialog';
import { BrandLogo } from '../components/BrandLogo';
import { PublicHeader } from '../components/PublicHeader';
import { Link } from 'react-router-dom';

import { publicService } from '../services/publicService';
import { Loader } from '../components/Loader';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ label, value, icon, color }: StatCardProps) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", color)}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-4xl font-black text-primary tracking-tighter">{value}</h3>
    </div>
  </div>
);

export const Dashboard = () => {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => publicService.getStats(),
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => publicService.getRoles(),
  });

  const loading = statsLoading || rolesLoading;
  const data = statsData;

  const handleApply = (roleId?: string) => {
    setSelectedRoleId(roleId);
    setIsApplyOpen(true);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await publicService.downloadReport('Q1 Market Report');
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <Loader message="Syncing Intelligence..." />
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Failed to load intelligence data.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <PublicHeader onApply={() => handleApply()} />
      
      {/* Hero Section */}
      <div className="bg-primary text-white pt-20 pb-32 px-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <Globe className="w-full h-full scale-150" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
              <Activity size={14} className="text-teal-400" /> Live Market Intelligence
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8">
              The Pulse of <span className="text-teal-400 italic">Architectural</span> Excellence.
            </h1>
            <p className="text-lg text-slate-300 font-medium max-w-xl leading-relaxed">
              Real-time transparency into our global network, active mandates, and the impact we create across the built environment.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-20 space-y-12">
        {/* Impact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Total Placements" 
            value={data.stats.totalPlacements} 
            icon={<CheckCircle2 className="text-teal-600" size={24} />} 
            color="bg-teal-50"
          />
          <StatCard 
            label="Active Mandates" 
            value={data.stats.activeMandates} 
            icon={<Briefcase className="text-primary" size={24} />} 
            color="bg-slate-100"
          />
          <StatCard 
            label="Talent Pool" 
            value={data.stats.talentPoolSize} 
            icon={<Users className="text-secondary" size={24} />} 
            color="bg-secondary-container"
          />
          <StatCard 
            label="Avg. Time to Fill" 
            value={data.stats.avgTimeToFill} 
            icon={<Clock className="text-error" size={24} />} 
            color="bg-error-container"
          />
        </div>

        {/* Growth Analytics */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-primary tracking-tighter">Talent Pool Growth</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly verified candidate acquisition</p>
            </div>
            <div className="flex items-center gap-2 text-teal-600 font-bold text-sm">
              <TrendingUp size={18} /> +24% this quarter
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.historicalTalentPool || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#13696a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#13696a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#13696a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Open Mandates */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-primary tracking-tighter">Open Mandates</h2>
                <p className="text-on-surface-variant font-medium">High-priority roles currently active in our network.</p>
              </div>
              <button 
                onClick={() => handleApply()}
                className="text-xs font-bold uppercase tracking-widest text-secondary hover:underline flex items-center gap-2"
              >
                General Application <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {roles.map((role, i) => (
                <motion.div 
                  key={role.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-primary tracking-tight group-hover:text-secondary transition-colors">{role.title}</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{role.client}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-secondary" /> {role.location}</span>
                          <span className="flex items-center gap-1.5"><IndianRupee size={14} className="text-secondary" /> {formatRupeeAmount(role.salary)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
                        {role.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {role.expertise.map((skill: string, j: number) => (
                          <span key={j} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => handleApply(role.id)}
                        className="px-8 py-3 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary-container transition-all shadow-lg shadow-primary/10"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Reviews & Market Pulse */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-primary tracking-tight mb-8">Client Intelligence</h3>
              <div className="space-y-8">
                {data.reviews.map((review: any) => (
                  <div key={review.id} className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={14} className="text-amber-400 fill-current" />
                      ))}
                    </div>
                    <div className="relative">
                      <Quote className="absolute -left-2 -top-2 text-slate-100 w-8 h-8 -z-10" />
                      <p className="text-sm text-on-surface-variant leading-relaxed italic">
                        "{review.content}"
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center text-secondary font-black text-xs">
                        {review.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{review.author}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-secondary text-on-secondary p-8 rounded-3xl shadow-lg shadow-secondary/20">
              <TrendingUp size={32} className="mb-6" />
              <h3 className="text-xl font-bold tracking-tight mb-4">Market Pulse</h3>
              <div className="space-y-4 mb-8">
                {(data.marketTrends || []).map((trend: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/10 pb-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">{trend.label}</p>
                      <p className="text-[10px] opacity-70">{trend.status}</p>
                    </div>
                    <span className="text-sm font-black">{trend.growth}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className={cn(
                  "w-full py-4 bg-white text-primary rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2",
                  isDownloading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : null}
                {isDownloading ? 'Downloading...' : 'Download Q1 Report'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-slate-200 bg-slate-50 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 max-w-7xl mx-auto">
          <div>
            <BrandLogo className="mb-6" imgClassName="h-12" textClassName="text-lg" />
            <p className="text-slate-500 text-xs uppercase tracking-widest leading-loose mb-6">
              Architecting the future of recruitment with precision and integrity.
            </p>
            <div className="flex gap-4">
              <Globe size={20} className="text-slate-400 hover:text-secondary cursor-pointer" />
              <Mail size={20} className="text-slate-400 hover:text-secondary cursor-pointer" />
              <MessageSquare size={20} className="text-secondary hover:opacity-80 cursor-pointer" fill="currentColor" />
            </div>
          </div>
          <div>
            <h6 className="font-headline font-bold text-sm text-primary mb-6">Quick Links</h6>
            <ul className="space-y-4 text-slate-500 text-xs uppercase tracking-widest">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/intelligence" className="hover:underline">Market Intelligence</Link></li>
              <li><a href="#" className="hover:underline">Privacy Policy</a></li>
              <li><a href="#" className="hover:underline">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h6 className="font-headline font-bold text-sm text-primary mb-6">Contact</h6>
            <ul className="space-y-4 text-slate-500 text-xs tracking-widest uppercase">
              <li className="flex items-center gap-2"><Globe size={14} /> 1200 Avenue of Americas, NY</li>
              <li className="flex items-center gap-2"><Clock size={14} /> Mon - Fri: 9am - 6pm</li>
              <li className="flex items-center gap-2"><Mail size={14} /> hello@recruitrightsolutions.com</li>
            </ul>
          </div>
          <div>
            <h6 className="font-headline font-bold text-sm text-primary mb-6">Newsletter</h6>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-4">Get curated job alerts weekly.</p>
            <div className="flex gap-2">
              <input className="bg-white border-none text-[10px] p-3 w-full rounded focus:ring-1 focus:ring-secondary" placeholder="EMAIL" type="email"/>
              <button className="bg-secondary text-white p-2 rounded hover:bg-on-secondary-container transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 mt-12 pt-8 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest">
          <div>© 2024 Recruit Right Solutions. All rights reserved.</div>
          <div className="flex gap-6">
            <span>London</span>
            <span>New York</span>
            <span>Berlin</span>
          </div>
        </div>
      </footer>

      <ApplyDialog 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)} 
        selectedRole={selectedRoleId}
        roles={roles}
      />
    </div>
  );
};
