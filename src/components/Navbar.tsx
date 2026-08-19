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
  X,
  Sun,
  Moon
} from 'lucide-react';
import { TurfBookLogo } from './TurfBookLogo';
import { SportType, User, AppNotification } from '../types';
import { INDIAN_STATES_DISTRICTS, ALL_INDIAN_DISTRICTS_FORMATTED, smartFilterDistricts } from '../data/indianDistricts';
import { useTheme } from '../context/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredDistricts = districtSearch.trim()
    ? smartFilterDistricts(ALL_INDIAN_DISTRICTS_FORMATTED, districtSearch, 50)
    : ALL_INDIAN_DISTRICTS_FORMATTED.slice(0, 30);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-xs transition-colors duration-200">
      {/* Top Bar: Logo, Location, Search, Auth */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Location */}
        <div className="flex items-center gap-3 sm:gap-6 md:gap-8 shrink-0">
          <button
            onClick={() => {
              onSelectSport('All');
              onSearchChange('');
            }}
            className="text-left cursor-pointer"
          >
            <TurfBookLogo size="md" />
          </button>

          {/* Location Selector Pill (Desktop) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowCityMenu(!showCityMenu)}
              className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-4 py-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#2E7D32] dark:text-emerald-400" />
              <span className="max-w-[140px] truncate font-bold text-slate-700 dark:text-slate-200">
                {selectedCity === 'All' ? 'All Districts' : selectedCity}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Global Search Input (Desktop/Tablet) */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search turfs or venues..."
            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 pl-10 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-4 shrink-0">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 sm:p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-amber-400 hover:text-[#2E7D32] dark:hover:text-amber-300 transition-all cursor-pointer shadow-xs shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Filters Toggle */}
          <button
            onClick={onOpenFilters}
            className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-300 hover:text-[#2E7D32] dark:hover:text-emerald-400 hover:border-[#2E7D32]/30 transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#2E7D32] dark:text-emerald-400" />
            <span className="hidden lg:inline">Filters</span>
          </button>

          {/* Notifications Bell */}
          {user && (
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  if (unreadCount > 0) onMarkNotificationsRead();
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-300 hover:text-[#2E7D32] dark:hover:text-emerald-400 transition-colors relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 p-4 z-50 animate-in fade-in duration-150 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-slate-700 pb-2">
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200">Notifications</span>
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
                            n.read
                              ? 'bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300'
                              : 'bg-green-50/70 dark:bg-emerald-950/40 text-gray-800 dark:text-emerald-200 border-l-2 border-[#2E7D32] dark:border-emerald-400'
                          }`}
                        >
                          <p className="font-bold text-xs mb-0.5">{n.title}</p>
                          <p className="text-[11px] leading-snug">{n.message}</p>
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">
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
            <div className="relative shrink-0">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-green-50 dark:bg-emerald-950/50 border border-green-200 dark:border-emerald-800/80 text-[#2E7D32] dark:text-emerald-300 hover:bg-green-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#2E7D32] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold leading-none text-gray-900 dark:text-gray-100">{user.name}</p>
                  <p className="text-[10px] text-[#2E7D32] dark:text-emerald-400 capitalize font-semibold">{user.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#2E7D32] dark:text-emerald-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{user.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenDashboard();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-emerald-950/50 hover:text-[#2E7D32] dark:hover:text-emerald-300 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{user.role === 'owner' ? 'Owner Dashboard' : user.role === 'admin' ? 'Admin Panel' : 'My Bookings'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-2 border-t border-gray-100 dark:border-slate-700 mt-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => onOpenAuth('user')}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-[#2E7D32] dark:text-emerald-400 bg-green-50 dark:bg-emerald-950/50 hover:bg-green-100 dark:hover:bg-emerald-900/60 border border-green-200 dark:border-emerald-800/80 transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                <span className="sm:hidden">Login</span>
                <span className="hidden sm:inline">Player Login</span>
              </button>
              <button
                onClick={() => onOpenAuth('owner')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#43A047] shadow-md shadow-green-900/15 transition-all hidden sm:inline-block cursor-pointer shrink-0"
              >
                Owner Portal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE SEARCH & DISTRICT BAR */}
      <div className="sm:hidden px-4 py-2 bg-slate-50 dark:bg-slate-800/90 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
        {/* District selector pill */}
        <button
          onClick={() => setShowCityMenu(true)}
          className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 shadow-xs hover:border-[#2E7D32] transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-[#2E7D32] dark:text-emerald-400" />
          <span className="max-w-[105px] truncate">
            {selectedCity === 'All' ? 'All Districts' : selectedCity}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {/* Search input in mobile bar */}
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search turfs..."
            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
          />
        </div>
      </div>

      {/* DISTRICT SELECTOR MODAL / POPUP (Mobile & Desktop) */}
      {showCityMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#2E7D32] dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Select Indian District</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">780+ official districts across India</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCityMenu(false);
                  setDistrictSearch('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-gray-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  placeholder="Type district name (e.g. Pune, Jaipur, Patna, Delhi)..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  autoFocus
                />
              </div>
            </div>

            {/* All India Option */}
            <div className="p-2 border-b border-gray-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/20">
              <button
                onClick={() => {
                  onSelectCity('All');
                  setShowCityMenu(false);
                  setDistrictSearch('');
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  selectedCity === 'All'
                    ? 'bg-[#2E7D32] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/40 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>🇮🇳</span>
                  <span>All India / All Districts</span>
                </span>
                {selectedCity === 'All' && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
              </button>
            </div>

            {/* Districts List */}
            <div className="p-2 overflow-y-auto flex-1 max-h-72 space-y-1">
              {filteredDistricts.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    onSelectCity(d);
                    setShowCityMenu(false);
                    setDistrictSearch('');
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                    selectedCity === d
                      ? 'text-[#2E7D32] dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{d}</span>
                  {selectedCity === d && <CheckCircle2 className="w-4 h-4 text-[#2E7D32] dark:text-emerald-400 shrink-0" />}
                </button>
              ))}
              {filteredDistricts.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No district matching "{districtSearch}"</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Try typing another city or district name</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED SPORT SELECTOR BAR IN NAVIGATION - Matching Natural Tones design tabs */}
      <div className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-4 sm:px-8 py-2 flex items-center gap-6 overflow-x-auto no-scrollbar transition-colors">
        <button
          onClick={() => onSelectSport('All')}
          className={`sport-tab flex flex-col items-center gap-1 cursor-pointer py-1 px-3 text-xs font-bold shrink-0 ${
            selectedSport === 'All' ? 'active text-[#2E7D32] dark:text-emerald-400' : 'text-gray-400 hover:text-[#2E7D32] dark:hover:text-emerald-400'
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
                isSelected ? 'active text-[#2E7D32] dark:text-emerald-400' : 'text-gray-400 hover:text-[#2E7D32] dark:hover:text-emerald-400'
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
