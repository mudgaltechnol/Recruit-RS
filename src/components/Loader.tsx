import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export const Loader = ({ message = "Loading...", size = "md" }: { message?: string, size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "w-8 h-8 border-2",
    md: "w-16 h-16 border-4",
    lg: "w-24 h-24 border-8"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6", size === "sm" ? "min-h-0" : "min-h-[400px] w-full")}>
      <div className={cn("relative", sizes[size].split(" ").slice(0, 2).join(" "))}>
        <motion.div
          className={cn("absolute inset-0 border-slate-100 rounded-full", sizes[size].split(" ").slice(2).join(" "))}
          initial={{ opacity: 0.3 }}
        />
        <motion.div
          className={cn("absolute inset-0 border-t-primary rounded-full", sizes[size].split(" ").slice(2).join(" "))}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      {message && size !== "sm" && (
        <motion.p
          className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export const FullScreenLoader = ({ message }: { message?: string }) => {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <Loader message={message} />
    </div>
  );
};
