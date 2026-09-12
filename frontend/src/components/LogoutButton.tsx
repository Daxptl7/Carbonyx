import React from 'react';
import { LogOut } from 'lucide-react';

export interface LogoutButtonProps {
  variant?: 'sidebar-dark' | 'header' | 'default';
  className?: string;
  onLogout?: () => void;
}

export default function LogoutButton({
  variant = 'default',
  className = '',
  onLogout,
}: LogoutButtonProps) {
  const handleClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback to firing custom event if unhooked
      window.dispatchEvent(new CustomEvent('carbonyx:session-expired'));
    }
  };

  if (variant === 'sidebar-dark') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`group flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5 text-sm font-semibold text-rose-400 transition-all duration-200 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 active:scale-[0.99] ${className}`}
      >
        <span className="flex items-center gap-2.5">
          <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Sign out</span>
        </span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 group-hover:text-rose-300/80">
          ESC
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 ${className}`}
    >
      <LogOut className="h-4 w-4" />
      <span>Sign out</span>
    </button>
  );
}
