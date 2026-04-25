import React, { useState } from 'react';
import { Send, Mail, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Loader } from '../components/Loader';
const RequiredMark = () => <span className="ml-1 text-error">*</span>;
import { cn } from '@/src/lib/utils';

export const NewsletterAdmin = () => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const { data: subscribersData, isLoading: subscribersLoading } = useQuery({
    queryKey: ['newsletter-subscribers-count'],
    queryFn: () => adminService.getNewsletterSubscribersCount(),
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return;

    setIsSending(true);
    setStatus(null);
    try {
      const result = await adminService.sendNewsletter(subject, content);
      setStatus({ text: result.message || 'Newsletter sent successfully!', type: 'success' });
      setSubject('');
      setContent('');
    } catch (error: any) {
      setStatus({ text: error.message || 'Failed to send newsletter', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter mb-2">Newsletter Management</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Broadcast updates to your talent pool</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <Users size={18} className="text-secondary" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Subscribers</p>
              <p className="text-lg font-black text-primary leading-tight">
                {subscribersLoading ? '...' : subscribersData?.count?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <Mail size={20} className="text-primary" />
              <h3 className="font-bold text-primary uppercase tracking-widest text-sm">Compose Broadcast</h3>
            </div>
            
            <form onSubmit={handleSend} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Subject Line<RequiredMark /></label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Weekly Architectural Insights - Oct 2023"
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Content (HTML supported)<RequiredMark /></label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your newsletter content here..."
                  rows={12}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  required
                />
              </div>

              {content && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Live Preview</label>
                  <div className="w-full bg-slate-50 rounded-2xl p-8 border border-slate-100 min-h-[200px] prose prose-sm max-w-none shadow-inner">
                    {subject && (
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Subject</p>
                        <p className="text-lg font-black text-primary tracking-tight">{subject}</p>
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {status && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        status.type === 'success' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}
                    >
                      {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {status.text}
                    </motion.div>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={isSending}
                  className="bg-primary text-white h-[48px] px-8 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[180px]"
                >
                  {isSending ? <Loader message="" size="sm" /> : <Send size={18} />}
                  {isSending ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-primary uppercase tracking-widest text-xs mb-4">Tips for Success</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-blue-600">01</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">Use a compelling subject line to increase open rates.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-blue-600">02</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">Personalize your content for the architectural community.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-blue-600">03</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">Include clear calls to action for new mandates.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-blue-600">04</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">Test your HTML content in the live preview before sending.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-blue-600">05</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">Avoid using too many large images to ensure fast loading.</p>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl text-white">
            <h4 className="font-bold uppercase tracking-widest text-xs mb-4 text-teal-400">Recent History</h4>
            <div className="space-y-4">
              {[
                { date: 'Oct 12', subject: 'New York Mandates Update', sent: 1102 },
                { date: 'Oct 05', subject: 'Sustainability Trends 2023', sent: 1085 },
                { date: 'Sep 28', subject: 'Welcome to the Pool', sent: 1050 }
              ].map((h, i) => (
                <div key={i} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{h.date}</p>
                    <p className="text-xs font-medium truncate max-w-[140px]">{h.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">{h.sent}</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest">Sent</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
