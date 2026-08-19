import React, { useState } from 'react';
import { X, RotateCcw, Star, ShieldCheck, Check, MapPin, Search } from 'lucide-react';
import { FilterState, TurfFacility } from '../types';
import { ALL_INDIAN_DISTRICTS_FORMATTED, smartFilterDistricts } from '../data/indianDistricts';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onChangeFilters: (newFilters: FilterState) => void;
  onResetFilters: () => void;
}

const ALL_FACILITIES: { name: TurfFacility; label: string }[] = [
  { name: 'AC', label: 'Air Conditioned' },
  { name: 'Floodlights', label: 'Night Floodlights' },
  { name: 'Parking', label: 'Free Parking' },
  { name: 'Washrooms', label: 'Clean Washrooms' },
  { name: 'Cafeteria', label: 'Cafeteria & Snacks' },
  { name: 'Changing Rooms', label: 'Locker & Changing Rooms' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  onResetFilters,
}) => {
  const [districtQuery, setDistrictQuery] = useState('');

  if (!isOpen) return null;

  const toggleFacility = (fac: TurfFacility) => {
    const exists = filters.facilities.includes(fac);
    const updated = exists
      ? filters.facilities.filter((f) => f !== fac)
      : [...filters.facilities, fac];
    onChangeFilters({ ...filters, facilities: updated });
  };

  const filteredDistricts = districtQuery.trim()
    ? smartFilterDistricts(ALL_INDIAN_DISTRICTS_FORMATTED, districtQuery, 40)
    : ALL_INDIAN_DISTRICTS_FORMATTED.slice(0, 15);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Filter Turfs</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Refine results by pricing, rating & facilities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetFilters}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {/* District Selector (780+ Official Indian Districts) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              District / City (All 780+ Indian Districts)
            </label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={districtQuery}
                onChange={(e) => setDistrictQuery(e.target.value)}
                placeholder="Search district name..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, city: 'All' })}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  filters.city === 'All'
                    ? 'bg-[#2E7D32] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                🇮🇳 All India
              </button>
              {filteredDistricts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, city: d })}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                    filters.city === d
                      ? 'bg-[#2E7D32] text-white shadow-xs font-bold'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Max Price / Hour
              </label>
              <span className="text-sm font-black text-[#2E7D32] dark:text-emerald-400">
                ₹{filters.maxPrice} / hr
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="3500"
              step="100"
              value={filters.maxPrice}
              onChange={(e) =>
                onChangeFilters({ ...filters, maxPrice: Number(e.target.value) })
              }
              className="w-full accent-[#2E7D32] h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>₹500/hr</span>
              <span>₹3,500/hr</span>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Minimum Rating
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 3.5, 4.0, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => onChangeFilters({ ...filters, minRating: r })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    filters.minRating === r
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#2E7D32] dark:border-emerald-500 text-[#2E7D32] dark:text-emerald-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{r === 0 ? 'Any' : `${r}+`}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Indoor / Outdoor */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Venue Environment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All Arenas' },
                { id: 'indoor', label: 'Indoor AC' },
                { id: 'outdoor', label: 'Outdoor Turf' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() =>
                    onChangeFilters({
                      ...filters,
                      isIndoorFilter: opt.id as any,
                    })
                  }
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition-all ${
                    filters.isIndoorFilter === opt.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#2E7D32] dark:border-emerald-500 text-[#2E7D32] dark:text-emerald-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities & Facilities */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-3">
              Amenities & Facilities
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ALL_FACILITIES.map((fac) => {
                const checked = filters.facilities.includes(fac.name);
                return (
                  <button
                    key={fac.name}
                    type="button"
                    onClick={() => toggleFacility(fac.name)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#2E7D32] dark:border-emerald-500 text-[#2E7D32] dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{fac.label}</span>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                        checked
                          ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Apply CTA */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-xl shadow-md transition-all text-center"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
