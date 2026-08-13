import React, { useState } from 'react';
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  X
} from 'lucide-react';
import { TurfBookLogo } from './TurfBookLogo';
import { SportType, User, AppNotification } from '../types';
import { INDIAN_STATES_DISTRICTS, ALL_INDIAN_DISTRICTS_FORMATTED, smartFilterDistricts } from '../data/indianDistricts';

interface NavbarProps {
  user: User | null;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  selectedSport: SportType | 'All';
  onSelectSport: (sport: SportType | 'All') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenFilters: () => void;
  onOpenAuth: (role?: 'user' | 'owner') => void;
  onLogout: () => void;
  onOpenDashboard: () => void;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
}

const CITIES = ['All', 'Mumbai', 'Bangalore', 'Delhi NCR', 'Hyderabad', 'Pune', 'Goa', 'Chennai', 'Kolkata'];

const SPORTS_LIST: { name: SportType; icon: string }[] = [
  { name: 'Football', icon: '⚽' },
  { name: 'Cricket', icon: '🏏' },
  { name: 'Badminton', icon: '🏸' },
  { name: 'Tennis', icon: '🎾' },
  { name: 'Basketball', icon: '🏀' },
  { name: 'Volleyball', icon: '🏐' },
  { name: 'Pickleball', icon: '🏓' },
  { name: 'Table Tennis', icon: '🏓' },
  { name: 'Squash', icon: '🎾' },
  { name: 'Hockey', icon: '🏒' },
  { name: 'Futsal', icon: '⚽' },
];

export const Navbar: React.FC<NavbarProps> = ({
  user,
  selectedCity,
  onSelectCity,
  selectedSport,
  onSelectSport,
  searchQuery,
  onSearchChange,
  onOpenFilters,
  onOpenAuth,
  onLogout,
  onOpenDashboard,
  notifications,
  onMarkNotificationsRead,
}) => {
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredDistricts = districtSearch.trim()
    ? smartFilterDistricts(ALL_INDIAN_DISTRICTS_FORMATTED, districtSearch, 50)
    : ALL_INDIAN_DISTRICTS_FORMATTED.slice(0, 30);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs">
      {/* Top Bar: Logo, Location, Search, Auth */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Location */}
        <div className="flex items-center gap-6 md:gap-8">
          <button
            onClick={() => {
              onSelectSport('All');
              onSearchChange('');
            }}
            className="text-left"
          >
            <TurfBookLogo size="md" />
          </button>

          {/* Location Selector Pill (Desktop) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowCityMenu(!showCityMenu)}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-600 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span className="max-w-[140px] truncate font-bold text-slate-700">
                {selectedCity === 'All' ? 'All Districts' : selectedCity}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
            </button>

            {showCityMenu && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in duration-150 overflow-hidden">
                <div className="px-3 pb-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Select Indian District (780+)
                  </span>
                  <button
                    onClick={() => setShowCityMenu(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* District Filter Input */}
                <div className="p-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      placeholder="Type district name (e.g. Pune, Jaipur, Patna)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                      autoFocus
                    />
                  </div>
                </div>

                {/* All India Option */}
                <div className="px-2 pb-1">
                  <button
                    onClick={() => {
                      onSelectCity('All');
                      setShowCityMenu(false);
                      setDistrictSearch('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                      selectedCity === 'All'
                        ? 'bg-emerald-50 text-[#2E7D32] font-black'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>🇮🇳 All India / All Districts</span>
                    {selectedCity === 'All' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />}
                  </button>
                </div>

                {/* Districts List */}
                <div className="max-h-56 overflow-y-auto px-2 space-y-0.5">
                  {filteredDistricts.map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        onSelectCity(d);
                        setShowCityMenu(false);
                        setDistrictSearch('');
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-between ${
                        selectedCity === d
                          ? 'text-[#2E7D32] font-bold bg-emerald-50'
                          : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">{d}</span>
                      {selectedCity === d && <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />}
                    </button>
                  ))}
                  {filteredDistricts.length === 0 && (
                    <p className="px-3 py-4 text-center text-xs text-slate-400">
                      No district matching "{districtSearch}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Search Input (Desktop/Tablet) */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search turfs or venues..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-10 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all"
          />
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Filters Toggle */}
          <button
            onClick={onOpenFilters}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-[#2E7D32] hover:border-[#2E7D32]/30 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#2E7D32]" />
            <span className="hidden lg:inline">Filters</span>
          </button>

          {/* Notifications Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  if (unreadCount > 0) onMarkNotificationsRead();
                }}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-[#2E7D32] transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in duration-150 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <span className="font-bold text-xs text-gray-800">Notifications</span>
                    <span className="text-[10px] text-gray-400">{notifications.length} total</span>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No notifications yet</p>
                  ) : (
                    <div className="space-y-2.5">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl text-xs ${
                            n.read ? 'bg-gray-50 text-gray-600' : 'bg-green-50/70 text-gray-800 border-l-2 border-[#2E7D32]'
                          }`}
                        >
                          <p className="font-bold text-xs mb-0.5">{n.title}</p>
                          <p className="text-[11px] leading-snug">{n.message}</p>
                          <p className="text-[9px] text-gray-400 mt-1">
                            {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Profile or Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-green-50 border border-green-200 text-[#2E7D32] hover:bg-green-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#2E7D32] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold leading-none text-gray-900">{user.name}</p>
                  <p className="text-[10px] text-[#2E7D32] capitalize font-semibold">{user.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#2E7D32]" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-800">{user.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenDashboard();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-green-50 hover:text-[#2E7D32] transition-colors flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{user.role === 'owner' ? 'Owner Dashboard' : user.role === 'admin' ? 'Admin Panel' : 'My Bookings'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-gray-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('user')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#2E7D32] bg-green-50 hover:bg-green-100 border border-green-200 transition-colors"
              >
                Player Login
              </button>
              <button
                onClick={() => onOpenAuth('owner')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#43A047] shadow-md shadow-green-900/15 transition-all hidden sm:inline-block"
              >
                Owner Portal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE SEARCH & DISTRICT BAR */}
      <div className="sm:hidden px-4 py-2 bg-slate-50 border-t border-gray-100 flex items-center gap-2">
        {/* District selector pill */}
        <button
          onClick={() => setShowCityMenu(!showCityMenu)}
          className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shrink-0"
        >
          <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
          <span className="max-w-[90px] truncate">
            {selectedCity === 'All' ? 'District' : selectedCity}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search venue or location..."
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 pl-8 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
        </div>
      </div>

      {/* DEDICATED SPORT SELECTOR BAR IN NAVIGATION - Matching Natural Tones design tabs */}
      <div className="bg-white border-t border-gray-100 px-4 sm:px-8 py-2 flex items-center gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onSelectSport('All')}
          className={`sport-tab flex flex-col items-center gap-1 cursor-pointer py-1 px-3 text-xs font-bold shrink-0 ${
            selectedSport === 'All' ? 'active text-[#2E7D32]' : 'text-gray-400 hover:text-[#2E7D32]'
          }`}
        >
          <span className="text-lg">🏆</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider">All Sports</span>
        </button>

        {SPORTS_LIST.map((sp) => {
          const isSelected = selectedSport === sp.name;
          return (
            <button
              key={sp.name}
              onClick={() => onSelectSport(sp.name)}
              className={`sport-tab flex flex-col items-center gap-1 cursor-pointer py-1 px-3 text-xs font-bold shrink-0 ${
                isSelected ? 'active text-[#2E7D32]' : 'text-gray-400 hover:text-[#2E7D32]'
              }`}
            >
              <span className="text-lg">{sp.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">{sp.name}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
