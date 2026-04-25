import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Clock, 
  Target, 
  Zap, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  BarChart3,
  Globe,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Loader } from '../components/Loader';
import { cn } from '@/src/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const AdminIntelligence = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader /></div>;

  const heroStats = [
    { label: 'Open Roles', value: stats?.openRoles, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Candidates', value: stats?.activeCandidates, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Interview Stage', value: stats?.interviewStage, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Selection Goal', value: `${stats?.monthlySelections}/${stats?.selectionGoal}`, icon: Target, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Intelligence</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Real-time Situational Awareness</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            System Live
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Last Sync: Just Now
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {heroStats.map((stat, i) => (
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
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <ChevronRight size={14} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Market Trends */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-teal-400 uppercase tracking-[0.2em] text-[10px]">Market Trends</h3>
                <p className="text-sm font-bold text-white/60">Real-time skill demand & growth</p>
              </div>
              <Globe size={24} className="text-white/20" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {stats?.marketTrends.map((trend: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{trend.label}</span>
                      <span className="text-xs font-black text-teal-400">{trend.growth}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: trend.growth.replace('+', '').replace('%', '') + '%' }}
                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                        className="h-full bg-teal-400 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Revenue Pulse</p>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-4xl font-black text-white tracking-tighter">{stats?.revenue.current}</h4>
                    <span className="text-xs font-black text-emerald-400">{stats?.revenue.growth}</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-widest">Target: {stats?.revenue.target}</p>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Progress to Target</span>
                    <span className="text-xs font-black text-white">82%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[82%] rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Skills */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px]">Top Skills</h3>
              <p className="text-sm font-bold text-slate-400">Most requested expertise</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <BarChart3 size={18} />
            </div>
          </div>

          <div className="space-y-4">
            {stats?.topSkills.map((skill: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <div className="text-[10px] font-black text-slate-400 w-4">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">{skill.name}</span>
                    <span className="text-[10px] font-black text-slate-400">{skill.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(skill.count / stats.topSkills[0].count) * 100}%` }}
                      transition={{ duration: 1, delay: 0.3 + (i * 0.1) }}
                      className="h-full bg-slate-900 rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px]">Recent Activity</h3>
              <p className="text-sm font-bold text-slate-400">Live stream of platform events</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Feed</span>
            </div>
          </div>

          <div className="space-y-6">
            {stats?.recentActivity.map((activity: any, i: number) => (
              <div key={activity.id} className="flex items-center gap-4 group">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                  activity.type === 'application' ? "bg-blue-50 text-blue-600" :
                  activity.type === 'interview' ? "bg-purple-50 text-purple-600" :
                  activity.type === 'placement' ? "bg-emerald-50 text-emerald-600" :
                  "bg-amber-50 text-amber-600"
                )}>
                  {activity.type === 'application' ? <Users size={20} /> :
                   activity.type === 'interview' ? <Activity size={20} /> :
                   activity.type === 'placement' ? <CheckCircle2 size={20} /> :
                   <Zap size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {activity.user} <span className="text-slate-400 font-medium">
                          {activity.type === 'application' ? 'applied for' :
                           activity.type === 'interview' ? 'scheduled for' :
                           activity.type === 'placement' ? 'placed as' :
                           'received an offer for'}
                        </span> {activity.target}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{activity.time}</p>
                    </div>
                    <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-900 transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Velocity & Health */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px]">System Velocity</h3>
              <p className="text-sm font-bold text-slate-400">Processing speed & health</p>
            </div>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>

          <div className="h-[200px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.velocityData.map((val: number, i: number) => ({ val, i }))}>
                <defs>
                  <linearGradient id="colorVel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVel)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time-to-Hire Reduction</span>
                <span className="text-xs font-black text-emerald-600">-{stats?.timeToHireReduction}%</span>
              </div>
              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[65%] rounded-full" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Newsletter Reach</span>
                <span className="text-xs font-black text-blue-600">{stats?.newsletterSubscribers}</span>
              </div>
              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[45%] rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
