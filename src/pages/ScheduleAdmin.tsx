import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User, 
  Briefcase,
  MoreVertical,
  CheckCircle2,
  X,
  ExternalLink,
  Target,
  Zap,
  ChevronDown,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Loader } from '../components/Loader';
const RequiredMark = () => <span className="ml-1 text-error">*</span>;
import { cn } from '@/src/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval, parseISO } from 'date-fns';

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  required
}: {
  options: { value: string, label: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  required?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = React.useMemo(() => {
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [options, searchTerm]);

  return (
    <div ref={wrapperRef} className="relative">
      <div 
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
        className={cn(
          "w-full bg-slate-50 rounded-xl py-3 px-4 text-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all cursor-pointer flex justify-between items-center border",
          required && !value && !isOpen ? 'border-red-200' : 'border-slate-50'
        )}
      >
        <span className={selectedOption ? "text-slate-900 line-clamp-1" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      <select 
        value={value} 
        onChange={() => {}} 
        className="w-0 h-0 opacity-0 absolute pointer-events-none" 
        required={required}
      >
        <option value="">Select</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-2 border-b border-slate-50 relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-lg py-2 pl-8 pr-3 text-sm focus:ring-0"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-center text-slate-400">No matching items</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 transition-colors line-clamp-1",
                    value === opt.value && "bg-primary/5 text-primary font-bold"
                  )}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ScheduleAdmin = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    type: 'Interview',
    location: '',
    notes: '',
    candidateId: '',
    candidateName: '',
    roleId: '',
    roleTitle: ''
  });

  // Handle body scroll locking
  useEffect(() => {
    if (isAddModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddModalOpen]);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['schedule-events'],
    queryFn: () => adminService.getScheduleEvents(),
  });

  useEffect(() => {
    if (events) {
      console.log('ScheduleAdmin: Received events, count:', events.length);
    }
  }, [events]);

  const { data: candidates } = useQuery({
    queryKey: ['admin-candidates'],
    queryFn: () => adminService.getCandidates(),
  });

  const { data: roles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminService.getRoles(),
  });

  // Pre-fill form from URL params
  useEffect(() => {
    const candidateId = searchParams.get('candidateId');
    const roleId = searchParams.get('roleId');

    if (candidateId || roleId) {
      setIsAddModalOpen(true);
      if (candidateId && candidates) {
        const cand = candidates.find((c: any) => c.id === candidateId);
        if (cand) {
          setEventForm(prev => ({
            ...prev,
            candidateId: cand.id,
            candidateName: cand.name,
            title: `Interview: ${cand.name}`
          }));
        }
      }
      if (roleId && roles) {
        const role = roles.find((r: any) => r.id === roleId);
        if (role) {
          setEventForm(prev => ({
            ...prev,
            roleId: role.id,
            roleTitle: role.title,
            title: prev.title || `Meeting: ${role.title}`
          }));
        }
      }
    }
  }, [searchParams, candidates, roles]);

  const addEventMutation = useMutation({
    mutationFn: (newEvent: any) => adminService.addScheduleEvent(newEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to book session.');
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminService.updateScheduleEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] });
      setIsAddModalOpen(false);
      setEditingEventId(null);
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to update session.');
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('Mutation: Deleting event', id);
      return adminService.deleteScheduleEvent(id);
    },
    onSuccess: (_, id) => {
      console.log('Mutation: Success, updating cache and invalidating');
      // Optimistically update the cache
      queryClient.setQueryData(['schedule-events'], (old: any[] | undefined) => {
        const filtered = old?.filter(e => String(e.id) !== String(id)) || [];
        console.log(`Cache updated: ${old?.length || 0} -> ${filtered.length}`);
        return filtered;
      });
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] });
    },
    onError: (error) => {
      console.error('Mutation: Error', error);
      alert('Failed to delete session. Please try again.');
    }
  });

  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const resetForm = () => {
    setEventForm({
      title: '',
      startTime: '',
      endTime: '',
      type: 'Interview',
      location: '',
      notes: '',
      candidateId: '',
      candidateName: '',
      roleId: '',
      roleTitle: ''
    });
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = new Date(selectedDate);
    const [startH, startM] = eventForm.startTime.split(':');
    startDateTime.setHours(parseInt(startH), parseInt(startM));

    const endDateTime = new Date(selectedDate);
    const [endH, endM] = eventForm.endTime.split(':');
    endDateTime.setHours(parseInt(endH), parseInt(endM));

    if (endDateTime <= startDateTime) {
      alert('End time must be later than start time.');
      return;
    }

    const payload = {
      ...eventForm,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      status: 'Scheduled'
    };

    if (editingEventId) {
      updateEventMutation.mutate({ id: editingEventId, data: payload });
    } else {
      addEventMutation.mutate(payload);
    }
  };

  const handleEditClick = (event: any) => {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    
    setEditingEventId(event.id);
    setEventForm({
      title: event.title,
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
      type: event.type,
      location: event.location || '',
      notes: event.notes || '',
      candidateId: event.candidateId || '',
      candidateName: event.candidateName || '',
      roleId: event.roleId || '',
      roleTitle: event.roleTitle || ''
    });
    setSelectedDate(start);
    setIsAddModalOpen(true);
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-primary tracking-tighter leading-none">Schedule</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Logistics & Coordination</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-primary"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-6 font-black text-primary uppercase tracking-widest text-xs min-w-[160px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-primary"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
            }}
            className="bg-white text-primary border border-slate-100 py-3.5 px-5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            Today
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-white py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-container transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Book Session
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, index) => (
          <div key={index} className="text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{day}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="grid grid-cols-7 gap-2 relative">
        {calendarDays.map((day, index) => {
          const dayEvents = events?.filter(event => isSameDay(parseISO(event.startTime), day)) || [];
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <motion.div 
              key={index}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "min-h-[110px] p-3 rounded-2xl transition-all cursor-pointer group relative border",
                !isCurrentMonth ? "bg-slate-50/40 border-transparent opacity-40" : "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20",
                isSelected && "border-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5 bg-primary/[0.02]"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg transition-all",
                  !isCurrentMonth ? "text-slate-300" : "text-slate-500",
                  isToday && "bg-primary text-white shadow-lg shadow-primary/30 scale-110",
                  isSelected && !isToday && "bg-slate-900 text-white"
                )}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-secondary shadow-sm shadow-secondary/50" />
                  </div>
                )}
              </div>
              
              <div className="space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((event, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "text-[8px] font-black px-1.5 py-0.5 rounded-md truncate uppercase tracking-tighter border",
                      event.type === 'Interview' ? "bg-blue-50/50 text-blue-700 border-blue-100/50" : 
                      event.type === 'Meeting' ? "bg-purple-50/50 text-purple-700 border-purple-100/50" :
                      "bg-teal-50/50 text-teal-700 border-teal-100/50"
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[7px] font-black text-slate-400 uppercase pl-1 mt-0.5 flex items-center gap-1">
                    <Plus size={6} /> {dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderSidebar = () => {
    const selectedDayEvents = events?.filter(event => isSameDay(parseISO(event.startTime), selectedDate)) || [];

    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-primary uppercase tracking-[0.2em] text-[10px]">Daily Agenda</h3>
              <p className="text-sm font-bold text-slate-400">{format(selectedDate, 'MMMM d, yyyy')}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <Clock size={18} />
            </div>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100">
                <Zap size={32} />
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No sessions booked</p>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="mt-6 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                + Schedule Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDayEvents.map((event) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={event.id} 
                  className="group relative bg-slate-50/50 p-5 rounded-3xl border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={cn(
                      "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                      event.type === 'Interview' ? "bg-blue-50 text-blue-600 border-blue-100" : 
                      event.type === 'Meeting' ? "bg-purple-50 text-purple-600 border-purple-100" :
                      "bg-teal-50 text-teal-600 border-teal-100"
                    )}>
                      {event.type}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEditClick(event)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                      >
                        <MoreVertical size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          console.log('Cancel button clicked for event:', event.id);
                          if (window.confirm('Are you sure you want to cancel this session? This action cannot be undone.')) {
                            console.log('User confirmed deletion for event:', event.id);
                            deleteEventMutation.mutate(event.id);
                          } else {
                            console.log('User cancelled deletion for event:', event.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-error hover:bg-error/5 rounded-lg transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-black text-primary text-sm mb-4 leading-tight tracking-tight">{event.title}</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100">
                        <Clock size={12} className="text-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600">
                        {format(parseISO(event.startTime), 'h:mm a')} - {format(parseISO(event.endTime), 'h:mm a')}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100">
                          <MapPin size={12} className="text-primary" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[160px] text-slate-600">
                          {event.location.startsWith('http') ? 'Virtual Session' : event.location}
                        </span>
                        {event.location.startsWith('http') && (
                          <a href={event.location} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    )}
                    {event.candidateName && (
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100">
                          <User size={12} className="text-primary" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600">{event.candidateName}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <h4 className="font-black uppercase tracking-[0.2em] text-[10px] mb-6 text-teal-400 flex items-center gap-2">
            <Target size={14} /> Logistics Overview
          </h4>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Interviews</p>
                <p className="text-2xl font-black text-white tracking-tighter">{events?.filter(e => e.type === 'Interview').length || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                <User size={24} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Client Briefings</p>
                <p className="text-2xl font-black text-white tracking-tighter">{events?.filter(e => e.type === 'Meeting').length || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                <Briefcase size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (eventsLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      {renderHeader()}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {renderDays()}
          {renderCells()}
        </div>
        <div className="lg:col-span-1">
          {renderSidebar()}
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-primary uppercase tracking-widest text-sm">{editingEventId ? 'Update Session' : 'Book New Session'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date: {format(selectedDate, 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEventId(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Session Title<RequiredMark /></label>
                  <input 
                    type="text" 
                    value={eventForm.title}
                    onChange={e => setEventForm({...eventForm, title: e.target.value})}
                    placeholder="e.g. First Interview: Marcus Chen"
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start Time<RequiredMark /></label>
                    <input 
                      type="time" 
                      value={eventForm.startTime}
                      onChange={e => setEventForm({...eventForm, startTime: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">End Time<RequiredMark /></label>
                    <input 
                      type="time" 
                      value={eventForm.endTime}
                      onChange={e => setEventForm({...eventForm, endTime: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Type<RequiredMark /></label>
                    <select 
                      value={eventForm.type}
                      onChange={e => setEventForm({...eventForm, type: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all appearance-none"
                      required
                    >
                      <option value="Interview">Interview</option>
                      <option value="Technical Review">Technical Review</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Client Briefing">Client Briefing</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location / Link<RequiredMark /></label>
                    <input 
                      type="text" 
                      value={eventForm.location}
                      onChange={e => setEventForm({...eventForm, location: e.target.value})}
                      placeholder="Zoom link or Office room"
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Candidate<RequiredMark /></label>
                    <SearchableSelect
                      options={(candidates || []).map((c: any) => ({ value: c.id, label: c.name }))}
                      value={eventForm.candidateId}
                      onChange={(val) => {
                        const cand = candidates?.find((c: any) => c.id === val);
                        setEventForm({
                          ...eventForm,
                          candidateId: val,
                          candidateName: cand ? cand.name : ''
                        });
                      }}
                      placeholder="Select Candidate"
                      required
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role<RequiredMark /></label>
                    <SearchableSelect
                      options={(roles || []).map((r: any) => ({ value: r.id, label: `${r.title} (${r.client})` }))}
                      value={eventForm.roleId}
                      onChange={(val) => {
                        const role = roles?.find((r: any) => r.id === val);
                        setEventForm({
                          ...eventForm,
                          roleId: val,
                          roleTitle: role ? role.title : ''
                        });
                      }}
                      placeholder="Select Role"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Internal Notes<RequiredMark /></label>
                  <textarea 
                    value={eventForm.notes}
                    onChange={e => setEventForm({...eventForm, notes: e.target.value})}
                    placeholder="Add any specific instructions or focus points..."
                    rows={3}
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={addEventMutation.isPending || updateEventMutation.isPending}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {(addEventMutation.isPending || updateEventMutation.isPending) ? <Loader message="" size="sm" /> : <CheckCircle2 size={18} />}
                  {(addEventMutation.isPending || updateEventMutation.isPending) ? (editingEventId ? 'Updating...' : 'Booking...') : (editingEventId ? 'Update Session' : 'Confirm Booking')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
