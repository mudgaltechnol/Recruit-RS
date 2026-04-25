import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  Zap,
  Briefcase,
  Search,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Loader } from '../components/Loader';
import { cn } from '@/src/lib/utils';

export const Reports = () => {
  const [activeRange, setActiveRange] = useState<'30d' | 'quarter' | 'year'>('quarter');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-reports', activeRange],
    queryFn: () => adminService.getReports(),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats', activeRange],
    queryFn: () => adminService.getStats(),
  });

  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate CSV generation and download
    setTimeout(() => {
      if (!reports) return;

      const headers = ['Stage', 'Count'];
      const rows = reports.funnel.map((item: any) => [item.stage, item.count]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `nexus_report_${activeRange}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 3000);
    }, 1500);
  };

  if (isLoading || statsLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader /></div>;

  const stats = [
    { label: 'Total Placements', value: `${statsData?.monthlySelections ?? 0}`, change: `${statsData?.selectionGoal ?? 0}% conversion`, trend: 'up', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg. Time to Fill', value: `${reports?.timeToFill?.[0]?.days ?? 0} Days`, change: `${reports?.timeToFill?.length ?? 0} role tracks`, trend: 'up', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Talent Pool', value: `${statsData?.activeCandidates ?? 0}`, change: `${statsData?.interviewStage ?? 0} interviewing`, trend: 'up', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Revenue', value: `${statsData?.revenue?.current ?? '$0'}`, change: `${statsData?.revenue?.growth ?? '0%'}`, trend: 'up', icon: TrendingUp, color: 'text-slate-900', bg: 'bg-slate-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Export Success Toast */}
      <AnimatePresence>
        {showExportSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
            <CheckCircle2 size={20} />
            Report exported successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Analytics</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Intelligence & Insights</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm">
            <button 
              onClick={() => setActiveRange('30d')}
              className={cn(
                "px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                activeRange === '30d' ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              Last 30 Days
            </button>
            <button 
              onClick={() => setActiveRange('quarter')}
              className={cn(
                "px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                activeRange === 'quarter' ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              Quarterly
            </button>
            <button 
              onClick={() => setActiveRange('year')}
              className={cn(
                "px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                activeRange === 'year' ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              Yearly
            </button>
          </div>
          
          <button 
            onClick={() => setShowFilterModal(true)}
            className="bg-white text-slate-900 border border-slate-100 p-3.5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Filter size={18} />
          </button>

          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "bg-white text-slate-900 border border-slate-100 py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2",
              isExporting && "opacity-50 cursor-not-allowed"
            )}
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterModal(false)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6">Advanced Filters</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Role Category</label>
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    <option>All Categories</option>
                    <option>Architecture</option>
                    <option>Urban Design</option>
                    <option>Interior Design</option>
                    <option>BIM Management</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Location</label>
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    <option>All Locations</option>
                    <option>New York</option>
                    <option>London</option>
                    <option>Berlin</option>
                    <option>Remote</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setShowFilterModal(false)}
                    className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => setShowFilterModal(false)}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black",
                stat.trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Hiring Funnel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px]">Hiring Funnel</h3>
              <p className="text-sm font-bold text-slate-400">Candidate conversion across stages</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <Zap size={18} />
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports?.funnel} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="stage" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b', textAnchor: 'end' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                  {reports?.funnel.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sourcing Quality */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-teal-400 uppercase tracking-[0.2em] text-[10px]">Sourcing Quality</h3>
                <p className="text-sm font-bold text-white/60">Performance by channel</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
                <Search size={18} />
              </div>
            </div>

            <div className="space-y-6">
              {reports?.sourcing.map((item: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{item.source}</span>
                    <span className="text-xs font-black text-teal-400">{item.quality}% Match</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.quality}%` }}
                      transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                      className="h-full bg-teal-400 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Top Performer</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-400/20 flex items-center justify-center text-teal-400">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{reports?.topPerformer?.source || 'No sourcing data'}</h4>
                  <p className="text-[10px] font-bold text-white/40">
                    {reports?.topPerformer ? `${reports.topPerformer.quality}% selection rate` : 'No live sourcing metrics yet'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue & Placements */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px]">Revenue Growth</h3>
              <p className="text-sm font-bold text-slate-400">Monthly billing & placements</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reports?.revenueGrowth}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0f172a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Time to Fill */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px]">Time to Fill</h3>
              <p className="text-sm font-bold text-slate-400">Average days by role category</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <Clock size={18} />
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports?.timeToFill}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="role" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="days" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40}>
                  {reports?.timeToFill.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.days > 30 ? '#ef4444' : entry.days > 20 ? '#3b82f6' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
