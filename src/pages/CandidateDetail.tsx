import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Download, 
  Share2, 
  CheckCircle2,
  Clock,
  Star,
  MessageSquare
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn, formatRupeeAmount } from '@/src/lib/utils';
import { motion } from 'motion/react';

import { adminService } from '../services/adminService';
import { Loader } from '../components/Loader';

export const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: candidate, isLoading: loading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => adminService.getCandidateById(id!),
    enabled: !!id,
  });

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loader message="Loading Profile..." />
    </div>
  );

  if (!candidate) return <div className="flex items-center justify-center h-full text-slate-400">Candidate not found.</div>;

  return (
    <div className="space-y-8">
      {/* Breadcrumbs & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/candidates" className="p-2 hover:bg-white rounded-full transition-colors flex-shrink-0">
            <ChevronLeft size={24} className="text-slate-400" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold text-primary tracking-tight truncate">{candidate.name}</h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{candidate.role} • {candidate.location}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center">
            <Share2 size={18} />
          </button>
          <button className="flex-1 md:flex-none p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center">
            <Download size={18} />
          </button>
          <button 
            onClick={() => navigate(`/admin/schedule?candidateId=${candidate.id}`)}
            className="flex-[2] md:flex-none bg-primary text-white px-4 md:px-6 py-2 rounded-lg font-bold text-sm hover:bg-primary-container transition-all"
          >
            Schedule Interview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl editorial-shadow border border-slate-100 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary to-primary-container relative">
              <div className="absolute -bottom-12 left-8">
                <img 
                  src={candidate.avatar} 
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg" 
                  alt={candidate.name}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="pt-16 pb-8 px-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-primary tracking-tighter">{candidate.name}</h2>
                  <p className="text-on-surface-variant font-medium">{candidate.role}</p>
                </div>
                <div className="flex items-center gap-2 bg-tertiary-fixed px-3 py-1.5 rounded-lg">
                  <Star className="text-on-tertiary-fixed-variant" size={16} fill="currentColor" />
                  <span className="text-sm font-black text-on-tertiary-fixed-variant">{candidate.matchScore}% Match</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <Mail size={14} className="text-secondary" /> {candidate.email}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <Phone size={14} className="text-secondary" /> {candidate.phone}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <MapPin size={14} className="text-secondary" /> {candidate.location}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-8 border-t border-slate-50 flex gap-8">
              {['profile', 'resume', 'interviews', 'notes'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative",
                    activeTab === tab ? "text-primary" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'profile' && (
              <>
                {/* Summary */}
                <div className="bg-white p-8 rounded-2xl editorial-shadow border border-slate-100">
                  <h3 className="text-lg font-bold text-primary tracking-tight mb-4">Professional Summary</h3>
                  <p className="text-on-surface-variant leading-relaxed">{candidate.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-6">
                    {candidate.skills.map((skill: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-surface-container-high text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience Timeline */}
                <div className="bg-white p-8 rounded-2xl editorial-shadow border border-slate-100">
                  <h3 className="text-lg font-bold text-primary tracking-tight mb-8">Experience Timeline</h3>
                  <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                    {candidate.timeline.map((item: any, i: number) => (
                      <div key={i} className="relative pl-10">
                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-secondary flex items-center justify-center z-10">
                          <div className="w-2 h-2 rounded-full bg-secondary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.year}</p>
                          <h4 className="text-base font-bold text-primary">{item.title}</h4>
                          <p className="text-sm text-on-surface-variant font-medium">{item.company}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="bg-white p-8 rounded-2xl editorial-shadow border border-slate-100">
                  <h3 className="text-lg font-bold text-primary tracking-tight mb-6">Education</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {candidate.education.map((edu: any, i: number) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">school</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-primary">{edu.degree}</h4>
                          <p className="text-xs text-on-surface-variant">{edu.school}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'interviews' && (
              <div className="bg-white p-8 rounded-2xl editorial-shadow border border-slate-100">
                <h3 className="text-lg font-bold text-primary tracking-tight mb-8">Interview Pipeline</h3>
                <div className="space-y-6">
                  {candidate.interviews.map((interview: any, i: number) => (
                    <div key={i} className="p-6 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          interview.status === 'Completed' ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-secondary-container text-on-secondary-container"
                        )}>
                          {interview.status === 'Completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-primary">{interview.type}</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{interview.date}</p>
                          {interview.feedback && (
                            <p className="mt-3 text-sm text-on-surface-variant italic">"{interview.feedback}"</p>
                          )}
                        </div>
                      </div>
                      {interview.score && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</p>
                          <p className="text-2xl font-black text-primary">{interview.score}<span className="text-xs text-slate-400">/10</span></p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          {/* Status Card */}
          <div className="bg-white p-8 rounded-2xl editorial-shadow border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Application Status</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-on-surface-variant">Current Stage</span>
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {candidate.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-on-surface-variant">Applied Date</span>
                <span className="text-sm font-bold text-primary">{candidate.appliedDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-on-surface-variant">Source</span>
                <span className="text-sm font-bold text-primary">{candidate.source}</span>
              </div>
              <div className="pt-6 border-t border-slate-50">
                <button className="w-full bg-slate-950 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                  Move to Next Stage
                </button>
                <button className="w-full mt-3 py-3 text-error font-bold text-sm hover:bg-error-container rounded-xl transition-colors">
                  Reject Candidate
                </button>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white p-8 rounded-2xl editorial-shadow border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Financials & Logistics</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expected Salary</p>
                <p className="text-sm font-bold text-primary">{formatRupeeAmount(candidate.expectedSalary)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notice Period</p>
                <p className="text-sm font-bold text-primary">{candidate.noticePeriod}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Availability</p>
                <p className="text-sm font-bold text-on-tertiary-container">Immediate</p>
              </div>
            </div>
          </div>

          {/* Quick Notes */}
          <div className="bg-surface-container-high p-8 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Internal Notes</h3>
            <div className="bg-white p-4 rounded-xl text-sm text-on-surface-variant leading-relaxed mb-4">
              Strong candidate for the Senior Architect role. Portfolio shows exceptional attention to detail in facade design.
            </div>
            <div className="relative">
              <textarea 
                className="w-full bg-white border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-secondary/20 transition-all" 
                placeholder="Add a private note..."
                rows={3}
              />
              <button className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-lg">
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
