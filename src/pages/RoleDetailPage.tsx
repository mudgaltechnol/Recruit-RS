import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Tag,
  Users,
  Clock,
  Share2,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Phone,
  Mail,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatRupeeAmount } from '@/src/lib/utils';
import { ApplyDialog } from '../components/ApplyDialog';
import { PublicHeader } from '../components/PublicHeader';
import { BrandLogo } from '../components/BrandLogo';
import { Loader } from '../components/Loader';
import { publicService } from '../services/publicService';

export const RoleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: allRoles = [], isLoading } = useQuery({
    queryKey: ['public-roles-detail'],
    queryFn: () => publicService.getRoles(),
  });

  const role = allRoles.find((r: any) => r.id === id);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/roles/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader message="Loading job details..." />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <PublicHeader onApply={() => {}} activePage="positions" />
        <div className="flex-1 flex items-center justify-center pt-24 px-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mx-auto">
              <Briefcase size={32} className="text-slate-400" />
            </div>
            <h2 className="font-headline text-2xl font-bold text-primary">Role Not Found</h2>
            <p className="text-on-surface-variant">This role may have been closed or removed.</p>
            <Link
              to="/positions"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-container transition-colors mt-4"
            >
              <ArrowLeft size={16} /> View All Positions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const expertiseTags: string[] = Array.isArray(role.expertise) ? role.expertise : [];
  const headcountParts = String(role.headcount || '0/1').split('/');
  const filled = parseInt(headcountParts[0]) || 0;
  const total = parseInt(headcountParts[1]) || 1;
  const fillPercent = Math.round((filled / total) * 100);

  return (
    <div className="min-h-screen bg-surface">
      <PublicHeader onApply={() => setIsApplyOpen(true)} activePage="positions" />

      <main className="pt-28 pb-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 md:p-12 editorial-shadow border border-slate-100 mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                  <Briefcase size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-2">{role.client}</p>
                  <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tighter text-primary leading-tight mb-3">
                    {role.title}
                  </h1>
                  <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} className="text-secondary" /> {role.location}
                    </span>
                    {role.experienceType && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} className="text-secondary" /> {role.experienceType}
                      </span>
                    )}
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest',
                      role.status === 'Open' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
                        role.status === 'Hold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    )}>
                      {role.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-all',
                    copied
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant border-transparent'
                      : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                  )}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                {role.status === 'Open' && (
                  <button
                    onClick={() => setIsApplyOpen(true)}
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-container transition-colors editorial-shadow"
                  >
                    Apply Now <ExternalLink size={15} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Description */}
              {role.description && (
                <div className="bg-white rounded-2xl p-8 editorial-shadow border border-slate-100">
                  <h2 className="font-headline text-lg font-bold text-primary mb-4">Role Description</h2>
                  <p className="text-on-surface-variant leading-relaxed whitespace-pre-line text-sm">
                    {role.description}
                  </p>
                </div>
              )}

              {/* Expertise */}
              {expertiseTags.length > 0 && (
                <div className="bg-white rounded-2xl p-8 editorial-shadow border border-slate-100">
                  <h2 className="font-headline text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <Tag size={18} className="text-secondary" /> Skills & Expertise Required
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {expertiseTags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-xs font-bold uppercase tracking-widest"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Banner */}
              {role.status === 'Open' && (
                <div className="bg-primary rounded-2xl p-8 text-white editorial-shadow">
                  <h3 className="font-headline text-xl font-bold mb-2">Ready to Apply?</h3>
                  <p className="text-slate-300 text-sm mb-6">
                    Submit your application and our team will review your profile within 2–3 business days.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setIsApplyOpen(true)}
                      className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
                    >
                      Apply Now <ExternalLink size={15} />
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
                    >
                      {copied ? <Check size={15} /> : <Share2 size={15} />}
                      {copied ? 'Link Copied!' : 'Share Role'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-6"
            >
              {/* Details Card */}
              <div className="bg-white rounded-2xl p-6 editorial-shadow border border-slate-100">
                <h3 className="font-headline text-sm font-bold text-primary uppercase tracking-widest mb-5">Role Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Compensation</p>
                    <p className="font-headline text-xl font-bold text-tertiary-container">{formatRupeeAmount(role.salary)}</p>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                    <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <MapPin size={14} className="text-secondary" /> {role.location}
                    </p>
                  </div>
                  {role.experienceType && (
                    <>
                      <div className="h-px bg-slate-100" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                        <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                          <Clock size={14} className="text-secondary" /> {role.experienceType}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="h-px bg-slate-100" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pipeline</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full"
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary shrink-0">{role.headcount}</span>
                    </div>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client</p>
                    <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <Users size={14} className="text-secondary" /> {role.client}
                    </p>
                  </div>
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-surface-container-low rounded-2xl p-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Share This Role</p>
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all',
                    copied
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                      : 'bg-white border border-outline-variant/20 text-primary hover:bg-slate-50 editorial-shadow'
                  )}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Link Copied!' : 'Copy Job Link'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <ApplyDialog
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        selectedRole={id}
        roles={allRoles}
      />

      {/* Footer */}
      <footer className="w-full py-12 border-t border-slate-200 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 max-w-7xl mx-auto">
          <div>
            <BrandLogo className="mb-6" imgClassName="h-12" textClassName="text-lg" />
            <p className="text-slate-500 text-xs uppercase tracking-widest leading-loose">
              Architecting careers with precision and purpose.
            </p>
          </div>
          <div>
            <h6 className="font-headline font-bold text-sm text-primary mb-6">Quick Links</h6>
            <ul className="space-y-4 text-slate-500 text-xs uppercase tracking-widest">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/positions" className="hover:underline">Open Positions</Link></li>
            </ul>
          </div>
          <div>
            <h6 className="font-headline font-bold text-sm text-primary mb-6">Contact</h6>
            <ul className="space-y-4 text-slate-500 text-xs tracking-widest uppercase">
              <li className="flex items-start gap-3"><Globe size={16} className="shrink-0 mt-0.5" />North Ex Mall, Rohini, Delhi-110085</li>
              <li className="flex items-center gap-3"><Phone size={16} className="shrink-0" /><a href="tel:9654884901" className="hover:text-secondary">+91 9654884901</a></li>
              <li className="flex items-center gap-3 break-all"><Mail size={16} className="shrink-0" /><a href="mailto:shiva@recruitrighthr.com" className="hover:text-secondary">shiva@recruitrighthr.com</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};
