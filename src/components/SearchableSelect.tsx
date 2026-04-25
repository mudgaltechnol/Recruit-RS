import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface SearchableSelectProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options and slice to max 10
  const filteredOptions = useMemo(() => {
    return options
      .filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 10);
  }, [options, searchTerm]);

  const selectedOption = React.useMemo(() => {
    return options.find(opt => opt.value === value);
  }, [options, value]);

  // Handle open state change
  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(prev => {
      const returningToOpen = !prev;
      if (returningToOpen) {
        setSearchTerm('');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      return returningToOpen;
    });
  };

  const handleSelect = (newValue: string) => {
    onChange(newValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={toggleOpen}
        className={cn(
          "w-full bg-slate-50 border-none rounded-lg px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-secondary/20 transition-all",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <span className={selectedOption ? "text-slate-800" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white rounded-xl editorial-shadow border border-slate-100 overflow-hidden"
          >
            <div className="p-2 border-b border-slate-50 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full bg-slate-50 border-none rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-0"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto w-full">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">No results found</div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <span>{option.label}</span>
                    {value === option.value && <Check size={14} className="text-primary" />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
