import React from 'react';
import { TurfBookLogo } from './TurfBookLogo';
import { ShieldCheck, MapPin, Heart, ArrowUpRight } from 'lucide-react';
import { SportType } from '../types';

interface FooterProps {
  onSelectSport: (sport: SportType) => void;
  onOpenTOS: () => void;
  onOpenAuth: (role?: 'user' | 'owner') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectSport,
  onOpenTOS,
  onOpenAuth,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-slate-800">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <TurfBookLogo size="md" className="text-white" />
            <p className="text-xs text-slate-400 leading-relaxed">
              BookMyShow inspired premier sports turf booking platform. Instant slot reservations, real-time owner approvals, and verified stadium venues.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>AES Encrypted User Data</span>
            </div>
          </div>

          {/* Col 2: Popular Sports */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Popular Sports
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {['Football', 'Cricket', 'Badminton', 'Tennis', 'Pickleball', 'Futsal'].map((sp) => (
                <li key={sp}>
                  <button
                    onClick={() => onSelectSport(sp as SportType)}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <span>{sp} Turfs</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Owner & Admin Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Portals & Venue Owners
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onOpenAuth('owner')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <span>List Your Turf Venue</span>
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAuth('owner')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Owner Dashboard Sign In
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTOS}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Terms of Service & Privacy
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Top Locations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Major Cities Covered
            </h4>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              {['Mumbai', 'Bangalore', 'Delhi NCR', 'Hyderabad', 'Pune', 'Goa', 'Chennai'].map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300 font-semibold border border-slate-700/60"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} TurfBook. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Crafted for sports lovers & turf owners</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};
