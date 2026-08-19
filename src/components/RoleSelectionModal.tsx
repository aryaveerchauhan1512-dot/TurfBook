import React from 'react';
import { User, Store, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { TurfBookLogo } from './TurfBookLogo';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSelectRole: (role: 'user' | 'owner') => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-[500px] rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#2E7D32] dark:bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
          Welcome to TurfBook
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 px-2 sm:px-6 leading-relaxed">
          Experience the finest sports arenas. Choose how you would like to continue with us today.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Continue as User */}
          <button
            onClick={() => onSelectRole('user')}
            className="group flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 p-6 rounded-2xl border-2 border-transparent hover:border-[#2E7D32] dark:hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#2E7D32] dark:text-emerald-400 flex items-center justify-center group-hover:bg-[#2E7D32] group-hover:text-white dark:group-hover:bg-emerald-500 dark:group-hover:text-white transition-colors">
              <User className="w-6 h-6" />
            </div>
            <div className="text-center sm:text-left">
              <span className="block font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#2E7D32] dark:group-hover:text-emerald-400 transition-colors">I am a User</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug block mt-0.5">Book turfs & play with friends</span>
            </div>
          </button>

          {/* Continue as Turf Owner */}
          <button
            onClick={() => onSelectRole('owner')}
            className="group flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 p-6 rounded-2xl border-2 border-transparent hover:border-[#2E7D32] dark:hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#2E7D32] dark:text-emerald-400 flex items-center justify-center group-hover:bg-[#2E7D32] group-hover:text-white dark:group-hover:bg-emerald-500 dark:group-hover:text-white transition-colors">
              <Store className="w-6 h-6" />
            </div>
            <div className="text-center sm:text-left">
              <span className="block font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#2E7D32] dark:group-hover:text-emerald-400 transition-colors">I am an Owner</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug block mt-0.5">List your turf & manage bookings</span>
            </div>
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 px-4 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32] dark:text-emerald-400 shrink-0" />
            <span>Data is encrypted for your security. By continuing, you agree to TurfBook's Terms of Service.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
