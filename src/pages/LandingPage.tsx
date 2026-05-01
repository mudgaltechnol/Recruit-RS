import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  CloudUpload, 
  Globe, 
  Mail, 
  Phone, 
  Send, 
  Verified,
  Quote,
  Briefcase,
  Calendar,
  Users,
  Target,
  Search,
  Award,
  ShieldCheck,
  Clock,
  Settings,
  Headset,
  Linkedin,
  Instagram,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { cn, formatRupeeAmount } from '@/src/lib/utils';
import { ApplyDialog } from '../components/ApplyDialog';
import { PublicHeader } from '../components/PublicHeader';
import { Link, useNavigate } from 'react-router-dom';

import { publicService } from '../services/publicService';
import { Loader } from '../components/Loader';
import { BrandLogo } from '../components/BrandLogo';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [copiedRoleId, setCopiedRoleId] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<string[]>([]);

  const handleShareRole = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/roles/${roleId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedRoleId(roleId);
      setTimeout(() => setCopiedRoleId(null), 2000);
    });
  };

  const toggleDescription = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDescriptions(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const { data: roles = [], isLoading: loading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => publicService.getRoles(),
  });

  const { data: statsData } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => publicService.getStats(),
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ['public-testimonials'],
    queryFn: () => publicService.getTestimonials(),
  });

  const handleApply = (roleId?: string) => {
    setSelectedRoleId(roleId);
    setIsApplyOpen(true);
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    
    setIsSubscribing(true);
    setSubscribeMessage(null);
    try {
      await publicService.subscribeNewsletter(newsletterEmail);
      setSubscribeMessage({ text: 'Subscribed successfully!', type: 'success' });
      setNewsletterEmail('');
    } catch (error: any) {
      setSubscribeMessage({ text: error.message || 'Subscription failed', type: 'error' });
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <Loader message="Loading Recruit Right Solutions..." />
    </div>
  );

  return (
    <div className="bg-surface">
      <PublicHeader onApply={() => handleApply()} activePage="home" />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-8 overflow-hidden bg-surface-container-low">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-7 z-10"
            >
              <BrandLogo className="mb-6" imgClassName="h-14 max-w-[72px]" textClassName="text-lg md:text-xl" />
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-primary leading-none tracking-tighter mb-8">
                Get Hired <span className="text-secondary italic">Faster</span>.
              </h1>
              <p className="text-on-surface-variant text-lg md:text-xl max-w-xl leading-relaxed mb-10">
                We curate professional connections between world-class talent and industry-shaping organizations using architectural precision and tonal depth.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#roles" className="bg-primary text-white px-8 py-4 rounded font-headline font-bold flex items-center gap-2 hover:bg-primary-container transition-all editorial-shadow">
                  View Open Roles
                  <ArrowRight size={20} />
                </a>
                <button 
                  onClick={() => handleApply()}
                  className="bg-surface-container-lowest text-primary px-8 py-4 rounded font-headline font-bold border border-outline-variant/20 hover:bg-white transition-all"
                >
                  Submit Resume
                </button>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden editorial-shadow bg-surface-container-high">
                <img 
                  className="w-full h-full object-cover grayscale-[20%] contrast-[110%]" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOYbJMR9ZCRg9H7VGxnfKMjHcrNw5rW6pBJezv9XnNtACowGE81xgXQNal-jteH_2TiMuR9HoIp_1g10_CgxAOhTvV3rV2TypnQhR9X62akJ4dNo48umuWjxuBchMVoAachPqFmfzFkfqdtFrcX2abVFEqoKO3n8G6153kVgyyNpc19ke44YkKP3eOgEmA3ys7cLPyQ4r5sfgSZ1AD8c92zpvfD3kwbYZxnYeA2WEtHWB0iTYv0WiHMm7tCi7uI0w9Jg-gIBPWBpBI" 
                  alt="Professional"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-tertiary-container p-6 rounded-lg editorial-shadow backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center">
                    <Verified className="text-tertiary" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-white font-headline font-bold">Top 1% Agency</p>
                    <p className="text-on-tertiary-container text-sm">Certified Recruitment Excellence</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Metrics */}
        <section className="py-24 px-8 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Open Roles Globally", value: statsData?.stats?.activeMandates ?? "0", color: "border-secondary" },
                { label: "Candidates Placed", value: statsData?.stats?.totalPlacements ?? "0", color: "border-tertiary-fixed" },
                { label: "Partner Companies", value: statsData?.totalClients ?? "0", color: "border-primary" }
              ].map((metric, i) => (
                <div key={i} className={`bg-surface-container-low p-10 rounded-xl transition-all hover:bg-white hover:editorial-shadow border-l-4 ${metric.color}`}>
                  <h3 className="font-headline text-5xl font-black text-primary mb-2">{metric.value}</h3>
                  <p className="text-on-surface-variant uppercase tracking-widest text-xs font-medium">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Us */}
        <section className="py-24 px-8 bg-surface" id="about">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block py-1 px-3 bg-tertiary-container text-on-tertiary-container text-xs font-bold uppercase tracking-widest rounded mb-6">About Us</span>
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-primary mb-6 leading-tight tracking-tighter">
                Your Strategic Hiring Partner
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed mb-6">
                At Recruit Right HR, we are more than a staffing agency — we are your strategic hiring partner. With deep expertise in recruitment and HR solutions, our mission is to deliver quality talent that drives organizational growth and performance.
              </p>
              <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
                Our team of seasoned HR professionals works closely with clients to understand business culture, role expectations, and long-term objectives — ensuring every placement is the right fit. Whether you need junior staff, mid-level specialists, or senior leadership, we tailor our approach for results and maximum value.
              </p>
              <div className="space-y-4">
                {[
                  "Transparent communication and tailored strategy",
                  "Thorough candidate screening and qualification",
                  "Efficient turn-around times and reliable support"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="text-secondary shrink-0 mt-0.5" size={20} />
                    <span className="text-on-surface font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl transform rotate-3 scale-105" />
              <img 
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Our Team" 
                className="relative rounded-3xl editorial-shadow object-cover aspect-[4/3] w-full"
              />
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-24 px-8 bg-surface-container-low" id="why-choose-us">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block py-1 px-3 bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest rounded mb-6">Why Choose Us</span>
              <h2 className="font-headline text-4xl font-extrabold text-primary mb-4 tracking-tighter">Speed-Driven Hiring. Quality-Focused Results.</h2>
              <p className="text-on-surface-variant text-lg">Our leadership team brings proven hiring experience across renowned multinational companies.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <Briefcase className="text-primary" size={32} />, title: 'Industry-Focused Expertise', desc: 'We recruit across sectors including IT, finance, healthcare, engineering, sales & marketing, operations, and more.' },
                { icon: <ShieldCheck className="text-secondary" size={32} />, title: 'Quality-First Screening', desc: 'Every candidate is evaluated meticulously for deep technical skills and aligned cultural fit.' },
                { icon: <Clock className="text-tertiary" size={32} />, title: 'Faster Turnaround', desc: 'We streamline the entire hiring process without ever compromising on the caliber of the talent.' },
                { icon: <Headset className="text-success" size={32} />, title: 'Dedicated Support', desc: 'We assist employers and job-seekers comprehensively through every step of the hiring lifecycle.' }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl editorial-shadow hover:-translate-y-2 transition-all">
                  <div className="w-16 h-16 rounded-xl bg-surface-container-lowest flex items-center justify-center mb-6">
                    {item.icon}
                  </div>
                  <h3 className="font-headline font-bold text-xl text-primary mb-3">{item.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-8 bg-surface" id="how-it-works">
          <div className="max-w-7xl mx-auto">
            <div className="text-left mb-16">
              <h2 className="font-headline text-4xl font-extrabold text-primary mb-4 tracking-tighter">How We Work</h2>
              <p className="text-on-surface-variant text-lg max-w-2xl">We partner with organizations to deliver high-impact talent through a structured, insight-driven recruitment approach — focused on speed, precision, and long-term value.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-[44px] left-[12%] right-[12%] h-0.5 bg-outline-variant/30 z-0"></div>
              {[
                { num: "01", icon: <Settings size={24} />, title: "Strategic Requirement Alignment", desc: "Deep discovery to understand your business context, roadmap, and expectations ensuring complete alignment." },
                { num: "02", icon: <Search size={24} />, title: "Precision Talent Search", desc: "Leveraging our strong network, we identify, assess, and engage high-calibre professionals securely." },
                { num: "03", icon: <Target size={24} />, title: "Curated Shortlisting & Interviews", desc: "You receive a refined shortlist of thoroughly vetted candidates. We manage interviews to maintain momentum." },
                { num: "04", icon: <Award size={24} />, title: "Confident Hiring & Closure", desc: "From offer strategy to final onboarding support, we ensure a smooth closure to secure top talent." }
              ].map((step, i) => (
                <div key={i} className="relative z-10 w-full flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-surface-container-lowest editorial-shadow mb-6 flex flex-col items-center justify-center text-primary group hover:border-primary transition-colors">
                    <span className="text-xs font-black opacity-30 mb-0.5">{step.num}</span>
                    {step.icon}
                  </div>
                  <h3 className="text-center font-headline font-bold text-lg text-primary mb-3">{step.title}</h3>
                  <p className="text-center text-on-surface-variant text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Services */}
        <section className="py-24 px-8 bg-surface-container-low" id="services">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-4xl font-extrabold text-primary mb-16 text-center tracking-tighter">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Contract & Temporary Staffing", desc: "Need project support or seasonal workforce flexibility? We provide skilled professionals on flexible terms to help you maintain productivity without extra overhead.", icon: <Users size={32} className="text-white" />, bg: "bg-primary" },
                { title: "Permanent Staffing", desc: "Your success hinges on exceptional people. Our permanent staffing solutions connect you with candidates who have the skills, drive, and cultural fit to make long-term contributions.", icon: <Briefcase size={32} className="text-white" />, bg: "bg-secondary" },
                { title: "Executive Search & Leadership", desc: "We specialize in identifying, vetting, and placing senior leaders that elevate your organization. Using market insights, we deliver top-tier talent matching your vision.", icon: <Award size={32} className="text-white" />, bg: "bg-primary/80" }
              ].map((svc, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden editorial-shadow flex flex-col h-full group hover:shadow-xl transition-shadow">
                  <div className={`p-8 ${svc.bg} flex items-center justify-center`}>
                    {svc.icon}
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="font-headline font-bold text-2xl text-primary mb-4">{svc.title}</h3>
                    <p className="text-on-surface-variant leading-relaxed flex-1">{svc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="py-24 px-8 bg-surface-container-low" id="roles">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="font-headline text-4xl font-extrabold text-primary mb-4 tracking-tighter">Curated Opportunities</h2>
                <p className="text-on-surface-variant max-w-md">Our active selection of high-impact roles at leading technology and architecture firms.</p>
              </div>
              <Link to="/positions" className="hidden md:flex items-center gap-2 text-secondary font-bold hover:gap-4 transition-all">
                View All Positions <ArrowRight size={20} />
              </Link>
            </div>
            <div className="space-y-6">
              {roles.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">Loading mandates...</div>
              ) : roles.map((role: any, i: number) => (
                <div key={i} className="bg-surface-container-lowest rounded-lg group transition-all hover:editorial-shadow overflow-hidden">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center font-headline font-black text-primary group-hover:bg-secondary-container transition-colors shrink-0">
                        {role.id.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <button
                          onClick={() => navigate(`/roles/${role.id}`)}
                          className="font-headline text-xl font-bold text-primary group-hover:text-secondary transition-colors hover:underline text-left"
                        >
                          {role.title}
                        </button>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-on-surface-variant">
                          <span className="flex items-center gap-1"><Briefcase size={14} /> {role.client}</span>
                          <span className="flex items-center gap-1"><Globe size={14} /> {role.location}</span>
                          {role.experienceType && <span className="flex items-center gap-1"><Clock size={14} /> {role.experienceType}</span>}
                        </div>
                        {role.expertise?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {role.expertise.slice(0, 4).map((exp: string, j: number) => (
                              <span key={j} className="px-2 py-0.5 bg-secondary/10 text-secondary rounded text-[9px] font-bold uppercase tracking-widest">{exp}</span>
                            ))}
                            {role.expertise.length > 4 && <span className="text-[9px] font-bold text-slate-400">+{role.expertise.length - 4} more</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-3 shrink-0">
                      <span className="font-headline font-bold text-tertiary-container">{formatRupeeAmount(role.salary)}</span>
                      {role.description && (
                        <button
                          onClick={(e) => toggleDescription(role.id, e)}
                          title="Toggle description"
                          className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100"
                        >
                          {expandedDescriptions.includes(role.id) ? <ChevronUp size={16} /> : <FileText size={16} />}
                        </button>
                      )}
                      <button
                        onClick={(e) => handleShareRole(role.id, e)}
                        title="Copy job link"
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          copiedRoleId === role.id
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                            : 'text-slate-400 hover:text-primary hover:bg-slate-100'
                        )}
                      >
                        {copiedRoleId === role.id ? <Check size={16} /> : <Share2 size={16} />}
                      </button>
                      <button 
                        onClick={() => handleApply(role.id)}
                        className="bg-primary text-white px-5 py-2 rounded font-bold hover:bg-secondary transition-colors text-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {expandedDescriptions.includes(role.id) && role.description && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-0 border-t border-outline-variant/10">
                          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line mt-3">{role.description}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section (Now triggers dialog) */}
        <section className="py-24 px-8 bg-surface" id="submit">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-32">
              <h2 className="font-headline text-4xl font-extrabold text-primary mb-6 leading-tight tracking-tighter">Submit Your Resume</h2>
              <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
                Join our exclusive candidate pool. We don't just find jobs; we architect career paths that align with your long-term professional identity.
              </p>
              <ul className="space-y-4">
                {[
                  "Direct access to unlisted partner roles",
                  "Personalized resume critique & optimization",
                  "Interview prep with industry veterans"
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="text-on-tertiary-container" size={20} />
                    <span className="text-on-surface font-medium">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7 bg-surface-container-low p-8 md:p-12 rounded-2xl editorial-shadow text-center">
              <div className="py-12 space-y-8">
                <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mx-auto text-secondary">
                  <CloudUpload size={48} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-primary tracking-tighter">Ready to take the next step?</h3>
                  <p className="text-on-surface-variant max-w-md mx-auto">
                    Our curators are ready to review your portfolio and match you with the world's leading architectural firms.
                  </p>
                </div>
                <button 
                  onClick={() => handleApply()}
                  className="bg-primary text-white px-12 py-4 rounded-xl font-headline font-bold text-lg hover:bg-primary-container transition-all editorial-shadow"
                >
                  Start Application
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 px-8 bg-surface-container-low overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-4xl font-extrabold text-primary mb-16 text-center tracking-tighter">Trusted by Industry Leaders</h2>
            {testimonials.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">
                No testimonials available.
              </div>
            ) : (
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-max">
                  {testimonials.map((t: any, i: number) => (
                    <div
                      key={t.id ?? i}
                      className="bg-surface-container-lowest p-10 rounded-2xl editorial-shadow relative min-w-[320px] md:min-w-[460px] max-w-[460px]"
                    >
                      <Quote className="text-secondary-container absolute -top-4 left-6 opacity-50" size={64} fill="currentColor" />
                      <p className="text-on-surface-variant text-xl italic leading-relaxed mb-8 relative z-10">
                        "{t.content}"
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center font-headline font-black text-primary">
                          {String(t.author || "A").slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="font-headline font-bold text-primary">{t.author}</h5>
                          <p className="text-sm text-on-surface-variant">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Contact Us */}
        <section className="py-24 px-8 bg-surface border-t border-outline-variant/20" id="contact">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block py-1 px-3 bg-tertiary-container text-on-tertiary-container text-xs font-bold uppercase tracking-widest rounded mb-6">Contact Us</span>
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-primary mb-6 leading-tight tracking-tighter">
              Get in Touch
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed mb-12">
              Ready to find your next great hire or looking for your next career move? We are here to assist you through every step of the hiring lifecycle.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=shiva@recruitrighthr.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-xl font-headline font-bold hover:bg-primary-container transition-all editorial-shadow shrink-0">
                <Mail size={20} />
                Email Us via Gmail
              </a>
              <a href="tel:9654884901" className="flex items-center gap-3 bg-surface-container-low text-primary px-8 py-4 rounded-xl font-headline font-bold border border-outline-variant/20 hover:bg-white transition-all shrink-0">
                <Phone size={20} />
                Call +91 9654884901
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Apply Dialog */}
      <ApplyDialog 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)} 
        selectedRole={selectedRoleId}
        roles={roles}
      />

      {/* Footer */}
      <footer className="w-full py-12 border-t border-slate-200 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 max-w-7xl mx-auto">
          <div>
            <BrandLogo className="mb-6" imgClassName="h-12" textClassName="text-lg" />
            <p className="text-slate-500 text-xs uppercase tracking-widest leading-loose mb-6">
              Architecting the future of recruitment with precision and integrity.
            </p>
            <div className="flex gap-4">
              <a href="https://www.linkedin.com/company/recruitrightsolutions/" target="_blank" rel="noreferrer">
                <Linkedin size={20} className="text-slate-400 hover:text-secondary transition-colors" />
              </a>
              <a href="https://www.instagram.com/recruitrightsolutions.official" target="_blank" rel="noreferrer">
                <Instagram size={20} className="text-slate-400 hover:text-secondary transition-colors" />
              </a>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=shiva@recruitrighthr.com" target="_blank" rel="noreferrer">
                <Mail size={20} className="text-slate-400 hover:text-secondary transition-colors" />
              </a>
            </div>
          </div>
          <div>
            <h6 className="font-headline font-bold text-sm text-primary mb-6">Quick Links</h6>
            <ul className="space-y-4 text-slate-500 text-xs uppercase tracking-widest">
              <li><Link to="/positions" className="hover:underline">Open Positions</Link></li>
              <li><a href="#" className="hover:underline">Privacy Policy</a></li>
              <li><a href="#" className="hover:underline">Terms of Service</a></li>
              <li><a href="#contact" className="hover:underline">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h6 className="font-headline font-bold text-sm text-primary mb-6">Contact</h6>
            <ul className="space-y-4 text-slate-500 text-xs tracking-widest uppercase leading-relaxed">
              <li className="flex items-start gap-3"><Globe size={16} className="shrink-0 mt-0.5" />North Ex Mall, Sector 9, Rohini, B5 Road, Rohini, Delhi-110085</li>
              <li className="flex items-center gap-3"><Phone size={16} className="shrink-0" /> <a href="tel:9654884901" className="hover:text-secondary">+91 9654884901</a></li>
              <li className="flex items-center gap-3 break-all"><Mail size={16} className="shrink-0" /> <a href="https://mail.google.com/mail/?view=cm&fs=1&to=shiva@recruitrighthr.com" target="_blank" rel="noreferrer" className="hover:text-secondary">shiva@recruitrighthr.com</a></li>
            </ul>
          </div>
          <div>
            <h6 className="font-headline font-bold text-sm text-primary mb-6">Newsletter</h6>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-4">Get curated job alerts weekly.</p>
            <form onSubmit={handleNewsletterSubscribe} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input 
                  className="bg-white border-none text-[10px] p-3 w-full rounded focus:ring-1 focus:ring-secondary" 
                  placeholder="EMAIL" 
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={isSubscribing}
                  required
                />
                <button 
                  type="submit"
                  disabled={isSubscribing}
                  className="bg-secondary text-white p-2 rounded hover:bg-on-secondary-container transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
              {subscribeMessage && (
                <p className={cn(
                  "text-[9px] font-bold uppercase tracking-widest mt-1",
                  subscribeMessage.type === 'success' ? "text-green-600" : "text-red-600"
                )}>
                  {subscribeMessage.text}
                </p>
              )}
            </form>
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
    </div>
  );
};
