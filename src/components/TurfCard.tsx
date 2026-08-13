import React from 'react';
import { Star, MapPin, Sparkles, Shield, Clock } from 'lucide-react';
import { Turf } from '../types';

interface TurfCardProps {
  turf: Turf;
  onSelect: (turf: Turf) => void;
  onBookNow: (turf: Turf) => void;
}

export const TurfCard: React.FC<TurfCardProps> = ({ turf, onSelect, onBookNow }) => {
  return (
    <div
      onClick={() => onSelect(turf)}
      className="turf-card bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Cover Image Container */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-100">
          <img
            src={turf.images[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80'}
            alt={turf.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase text-gray-800 shadow-xs">
              {turf.isIndoor ? 'Indoor Arena' : 'Outdoor Turf'}
            </span>
            {turf.isFeatured && (
              <span className="px-2.5 py-1 bg-[#2E7D32] text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Featured
              </span>
            )}
          </div>

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{turf.rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-300">({turf.reviewCount})</span>
          </div>

          {/* Distance */}
          <div className="absolute bottom-3 left-3 text-white text-xs font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-green-400" />
            <span>{turf.city} • {turf.distanceKm} km away</span>
          </div>
        </div>

        {/* Details Content */}
        <div className="p-5">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-[#2E7D32] transition-colors line-clamp-1">
            {turf.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
            {turf.address}
          </p>

          {/* Sports supported tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {turf.sports.slice(0, 3).map((sp) => (
              <span
                key={sp}
                className="px-2 py-0.5 rounded-md bg-green-50 text-[#2E7D32] text-[10px] font-bold"
              >
                {sp}
              </span>
            ))}
            {turf.sports.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold">
                +{turf.sports.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Price & CTA */}
      <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-gray-100 mt-1">
        <div>
          <span className="text-[10px] uppercase font-semibold text-gray-400 block">Starting at</span>
          <span className="text-base font-extrabold text-[#2E7D32]">
            ₹{turf.pricePerHour}
            <span className="text-xs font-normal text-gray-500"> / hr</span>
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookNow(turf);
          }}
          className="px-4 py-2 bg-[#2E7D32] hover:bg-[#43A047] text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};
