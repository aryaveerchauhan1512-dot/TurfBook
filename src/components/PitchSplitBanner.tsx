import React from 'react';
import { ArrowRight, Trophy, Store } from 'lucide-react';

interface PitchSplitBannerProps {
  onExploreClick: () => void;
  onPartnerClick: () => void;
}

export const PitchSplitBanner: React.FC<PitchSplitBannerProps> = ({
  onExploreClick,
  onPartnerClick,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
      <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-emerald-900/40">
        
        {/* FOOTBALL PITCH WRAPPER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 relative min-h-[340px] md:min-h-[320px]">

          {/* ================= LEFT HALF: DAY TIME GREEN FOOTBALL TURF ================= */}
          <div className="relative p-8 sm:p-10 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1E7B1E] via-[#228B22] to-[#1B661B]">
            
            {/* Lawn Mower Stripe Pattern Overlay */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none" 
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 40px, transparent 40px, transparent 80px)',
              }}
            />

            {/* Grass Pitch Dotted Turf Texture */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Left Penalty Arc & Box Markings */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-32 border-2 border-r-2 border-l-0 border-white/30 rounded-r-full pointer-events-none" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-20 border border-white/20 pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-20 space-y-4 max-w-md">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white/90 text-[11px] font-black tracking-widest uppercase shadow-sm">
                <Trophy className="w-3.5 h-3.5 text-emerald-300" />
                <span>FOR SPORTS PLAYERS</span>
              </div>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                I want to Play
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-medium drop-shadow-sm">
                Book FIFA-certified turfs, box cricket, and courts with real-time slot selection and instant confirmation.
              </p>
            </div>

            {/* CTA Button */}
            <div className="relative z-20 pt-6">
              <button
                onClick={onExploreClick}
                className="group px-7 py-3.5 bg-white hover:bg-emerald-50 text-[#1B661B] font-black text-xs uppercase tracking-wider rounded-full shadow-lg hover:shadow-2xl transition-all duration-200 flex items-center gap-2 transform active:scale-95"
              >
                <span>EXPLORE ARENAS</span>
                <ArrowRight className="w-4 h-4 text-[#1B661B] transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* ================= RIGHT HALF: NIGHT FLOODLIGHT FOOTBALL PITCH ================= */}
          <div className="relative p-8 sm:p-10 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#16212D] via-[#1B2937] to-[#0F1720]">
            
            {/* Night Pitch Lawn Stripe Overlay */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #10B981 0px, #10B981 40px, transparent 40px, transparent 80px)',
              }}
            />

            {/* Pitch Dotted Texture Overlay */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#10B981 1.5px, transparent 1.5px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Right Penalty Arc & Box Markings */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-32 border-2 border-l-2 border-r-0 border-emerald-500/20 rounded-l-full pointer-events-none" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-20 border border-emerald-500/15 pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-20 space-y-4 max-w-md">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-950/60 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[11px] font-black tracking-widest uppercase shadow-sm">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>FOR TURF OWNERS</span>
              </div>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                I own a Turf
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                List your venue, manage bookings, approve slots, and boost revenues with TurfBook Partner portal.
              </p>
            </div>

            {/* CTA Button */}
            <div className="relative z-20 pt-6">
              <button
                onClick={onPartnerClick}
                className="group px-7 py-3.5 bg-[#238636] hover:bg-[#2ea043] text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg hover:shadow-2xl transition-all duration-200 flex items-center gap-2 transform active:scale-95 border border-emerald-400/30"
              >
                <span>PARTNER SIGN IN</span>
                <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* ================= CENTER HALF-WAY LINE & SPOT WITH "OR" BADGE ================= */}
          {/* Half-Way Center Line (Desktop) */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 -translate-x-1/2 z-10 pointer-events-none" />

          {/* Center Circle Pitch Outline (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-white/30 z-10 pointer-events-none" />

          {/* Center Spot "OR" Badge (Centered for both Mobile & Desktop) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-[#238636] pointer-events-none">
            <span className="text-xs sm:text-sm font-black italic text-slate-800 tracking-tight">
              OR
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
