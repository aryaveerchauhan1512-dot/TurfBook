import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Star,
  Clock,
  MapPin,
  Search,
  Filter,
  ShieldCheck,
  Trophy,
  ArrowRight,
  User as UserIcon,
  Store,
  ChevronRight,
  Bell,
  BellRing,
  X
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { TurfCard } from './components/TurfCard';
import { TurfDetailModal } from './components/TurfDetailModal';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { AuthModal } from './components/AuthModal';
import { FilterPanel } from './components/FilterPanel';
import { UserDashboard } from './components/UserDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TermsOfServiceModal } from './components/TermsOfServiceModal';
import { PitchSplitBanner } from './components/PitchSplitBanner';
import { Footer } from './components/Footer';
import { setupForegroundMessageListener } from './lib/fcmClient';

import {
  Turf,
  User,
  SportType,
  FilterState,
  AppNotification
} from './types';
import { DEMO_TURFS, filterDemoTurfs } from './data/demoTurfs';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);

  // Modals state
  const [showRoleSelectModal, setShowRoleSelectModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRoleTarget, setAuthRoleTarget] = useState<'user' | 'owner'>('user');
  const [showTOSModal, setShowTOSModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Dashboard modals
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [showOwnerDashboard, setShowOwnerDashboard] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [ownerInitialTab, setOwnerInitialTab] = useState<
    'turfs' | 'bookings' | 'calendar' | 'qr'
  >('turfs');
  const [ownerHighlightBookingId, setOwnerHighlightBookingId] = useState<string | undefined>(undefined);

  // Live Foreground Toast State
  const [foregroundToast, setForegroundToast] = useState<{
    title: string;
    body: string;
    bookingId?: string;
  } | null>(null);

  // Turf detail modal
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pendingTurfForBooking, setPendingTurfForBooking] = useState<Turf | null>(null);

  // Data & Filters - initialized as empty so only real user-created turfs appear
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loadingTurfs, setLoadingTurfs] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    city: 'All',
    selectedSport: 'All',
    maxPrice: 3500,
    minRating: 0,
    isIndoorFilter: 'all',
    facilities: [],
  });

  // Check stored user on mount and process query params
  useEffect(() => {
    const saved =
      localStorage.getItem('turfbook_user') ||
      sessionStorage.getItem('turfbook_user');
    let currentUser: User | null = null;
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
        setUser(currentUser);
      } catch (err) {
        console.error('Error parsing saved session:', err);
      }
    }

    // Check URL parameters for notification clicks (e.g. ?dashboard=owner&tab=bookings&bookingId=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const dashboardParam = urlParams.get('dashboard');
      const tabParam = urlParams.get('tab');
      const bookingIdParam = urlParams.get('bookingId');

      if (dashboardParam === 'owner') {
        if (currentUser && currentUser.role === 'owner') {
          if (tabParam) {
            setOwnerInitialTab(tabParam as any);
          }
          if (bookingIdParam) {
            setOwnerHighlightBookingId(bookingIdParam);
          }
          setShowOwnerDashboard(true);
        }
      }
    } catch (e) {
      console.warn('URL parsing error:', e);
    }
  }, []);

  // Listen for Service Worker messages and Foreground FCM Messages
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Service Worker postMessage listener (when notification is clicked or received)
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { bookingId } = event.data;
        if (user && user.role === 'owner') {
          setOwnerInitialTab('bookings');
          if (bookingId) {
            setOwnerHighlightBookingId(bookingId);
          }
          setShowOwnerDashboard(true);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    // Foreground FCM listener
    let cleanupFn: (() => void) | null = null;
    setupForegroundMessageListener((payload) => {
      const title = payload.title || 'New TurfBook Notification';
      const body = payload.body || 'You received a new update.';
      const bookingId = payload.data?.bookingId;

      setForegroundToast({ title, body, bookingId });
      fetchNotifications();

      // Auto dismiss after 8s
      setTimeout(() => {
        setForegroundToast((prev) => (prev?.title === title ? null : prev));
      }, 8000);
    }).then((unsub) => {
      if (unsub) {
        cleanupFn = unsub;
      }
    });

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [user]);

  // Fetch Turfs with active filters
  const fetchTurfs = async () => {
    setLoadingTurfs(true);
    try {
      const params = new URLSearchParams();
      if (filters.city !== 'All') params.append('city', filters.city);
      if (filters.selectedSport !== 'All')
        params.append('sport', filters.selectedSport);
      if (filters.searchQuery) params.append('search', filters.searchQuery);
      if (filters.isIndoorFilter !== 'all')
        params.append('isIndoor', filters.isIndoorFilter);
      if (filters.minRating > 0)
        params.append('minRating', filters.minRating.toString());
      if (filters.maxPrice < 3500)
        params.append('maxPrice', filters.maxPrice.toString());
      if (filters.facilities.length > 0)
        params.append('facilities', filters.facilities.join(','));

      const res = await fetch(`/api/turfs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTurfs(data);
          return;
        }
      }
      setTurfs([]);
    } catch (err) {
      console.warn('Backend fetch failed or offline:', err);
      setTurfs([]);
    } finally {
      setLoadingTurfs(false);
    }
  };

  useEffect(() => {
    fetchTurfs();
  }, [
    filters.city,
    filters.selectedSport,
    filters.searchQuery,
    filters.isIndoorFilter,
    filters.minRating,
    filters.maxPrice,
    filters.facilities,
  ]);

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!user || !user.id) return;
    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(user.id)}`);
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err: any) {
      if (err?.name === 'DOMException' || (err?.message && err.message.toLowerCase().includes('pattern'))) {
        return;
      }
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 6000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleMarkNotificationsRead = async () => {
    if (!user) return;
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  // Auth Handlers
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);

    if (pendingTurfForBooking) {
      setSelectedTurf(pendingTurfForBooking);
      setShowDetailModal(true);
      setPendingTurfForBooking(null);
    } else {
      if (loggedInUser.role === 'admin') {
        setShowAdminDashboard(true);
      } else if (loggedInUser.role === 'owner') {
        setShowOwnerDashboard(true);
      } else {
        setShowUserDashboard(true);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowUserDashboard(false);
    setShowOwnerDashboard(false);
    setShowAdminDashboard(false);
    setShowDetailModal(false);
    setSelectedTurf(null);
    setPendingTurfForBooking(null);
    localStorage.removeItem('turfbook_user');
    sessionStorage.removeItem('turfbook_user');
  };

  // Open Dashboard based on role
  const handleOpenRoleDashboard = () => {
    if (!user) {
      setShowRoleSelectModal(true);
      return;
    }
    if (user.role === 'admin') setShowAdminDashboard(true);
    else if (user.role === 'owner') setShowOwnerDashboard(true);
    else setShowUserDashboard(true);
  };

  // Categorized Turfs for Landing Page
  const featuredTurfs = turfs.filter((t) => t.isFeatured || t.rating >= 4.8);
  const popularTurfs = turfs.filter((t) => t.isPopular || t.reviewCount >= 20);
  const topRatedTurfs = turfs.filter((t) => t.rating >= 4.7);
  const recentlyAddedTurfs = [...turfs].reverse();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-[#2E7D32]/20 selection:text-[#2E7D32] transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar
        user={user}
        selectedCity={filters.city}
        onSelectCity={(city) => setFilters({ ...filters, city })}
        selectedSport={filters.selectedSport}
        onSelectSport={(sport) => setFilters({ ...filters, selectedSport: sport })}
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => setFilters({ ...filters, searchQuery: q })}
        onOpenFilters={() => setShowFilterPanel(true)}
        onOpenAuth={(role) => {
          if (role) setAuthRoleTarget(role);
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        onOpenDashboard={handleOpenRoleDashboard}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Hero Section Banner */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-[#1b4d1f] text-white py-12 md:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Premier Sports Turf Booking Platform</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none text-white">
                Book Your Favorite <span className="text-emerald-400">Sports Turf</span> Instantly.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Real-time slot availability, instant owner approvals, FIFA-certified pitches, and high intensity floodlight arenas near you.
              </p>

              {/* Quick Action Entry CTA */}
              {!user && (
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowRoleSelectModal(true)}
                    className="px-6 py-3.5 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setAuthRoleTarget('owner');
                      setShowAuthModal(true);
                    }}
                    className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2"
                  >
                    <Store className="w-4 h-4 text-emerald-400" />
                    <span>List Your Turf Venue</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Hero Banner Stat Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-6 rounded-3xl md:w-80 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-slate-300 font-bold uppercase text-[10px]">Instant Booking</span>
                <span className="text-emerald-400 font-black">🟢 Live Slots</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Supported Sports</span>
                  <span className="font-bold text-white">11+ Disciplines</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Verified Owners</span>
                  <span className="font-bold text-white">100% Protected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Slot Updates</span>
                  <span className="font-bold text-emerald-400">Zero Refresh</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Football Pitch Split CTA Banner */}
        <PitchSplitBanner
          onExploreClick={() => {
            const el = document.getElementById('turf-listings');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          onPartnerClick={() => {
            setAuthRoleTarget('owner');
            setShowAuthModal(true);
          }}
        />

        {/* Selected Sport Filter Indicator Banner */}
        {filters.selectedSport !== 'All' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200/80 dark:border-emerald-800/60 py-3 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <span className="text-xs font-black text-[#2E7D32] dark:text-emerald-400">
                  Showing turfs exclusively supporting {filters.selectedSport}
                </span>
              </div>
              <button
                onClick={() => setFilters({ ...filters, selectedSport: 'All' })}
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                Clear Sport Filter
              </button>
            </div>
          </div>
        )}

        {/* Turf Sections Grid Container */}
        <div id="turf-listings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
          {loadingTurfs ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading sports turfs...</p>
            </div>
          ) : turfs.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 max-w-xl mx-auto shadow-xs my-8 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center text-[#2E7D32] dark:text-emerald-400 mx-auto mb-4">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">No Live Venues Listed Yet</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto mb-6">
                {filters.city !== 'All' || filters.selectedSport !== 'All' || filters.searchQuery
                  ? `No active turfs found for "${filters.city !== 'All' ? filters.city : ''} ${filters.selectedSport !== 'All' ? filters.selectedSport : ''} ${filters.searchQuery}". Try resetting search or listing your venue!`
                  : 'Welcome to TurfBook! Are you a turf owner? List your venue now to start receiving real-time online slot bookings from players across India.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setAuthRoleTarget('owner');
                    setShowAuthModal(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-[#2E7D32] hover:bg-[#43A047] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4 text-emerald-300" />
                  <span>List Your Turf Venue</span>
                </button>
                {(filters.city !== 'All' || filters.selectedSport !== 'All' || filters.searchQuery) && (
                  <button
                    onClick={() =>
                      setFilters({
                        searchQuery: '',
                        city: 'All',
                        selectedSport: 'All',
                        maxPrice: 3500,
                        minRating: 0,
                        isIndoorFilter: 'all',
                        facilities: [],
                      })
                    }
                    className="w-full sm:w-auto px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                  >
                    Reset Location & Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: FEATURED TURFS */}
              {featuredTurfs.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400 rounded-xl">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Featured Turfs</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Handpicked top tier stadium & indoor venues
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featuredTurfs.map((t) => (
                      <TurfCard
                        key={t.id}
                        turf={t}
                        onSelect={(turf) => {
                          setSelectedTurf(turf);
                          setShowDetailModal(true);
                        }}
                        onBookNow={(turf) => {
                          setSelectedTurf(turf);
                          setShowDetailModal(true);
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 2: POPULAR NEAR YOU */}
              {popularTurfs.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-xl">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Popular Near You</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Most booked grounds with high player activity
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {popularTurfs.map((t) => (
                      <TurfCard
                        key={t.id}
                        turf={t}
                        onSelect={(turf) => {
                          setSelectedTurf(turf);
                          setShowDetailModal(true);
                        }}
                        onBookNow={(turf) => {
                          setSelectedTurf(turf);
                          setShowDetailModal(true);
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 3: TOP RATED */}
              {topRatedTurfs.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
                        <Star className="w-5 h-5 fill-amber-500 dark:fill-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Top Rated Arenas</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Consistently rated 4.7+ stars by verified players
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {topRatedTurfs.map((t) => (
                      <TurfCard
                        key={t.id}
                        turf={t}
                        onSelect={(turf) => {
                          setSelectedTurf(turf);
                          setShowDetailModal(true);
                        }}
                        onBookNow={(turf) => {
                          setSelectedTurf(turf);
                          setShowDetailModal(true);
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 4: RECENTLY ADDED */}
              {recentlyAddedTurfs.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-[#2E7D32]/10 dark:bg-emerald-950/50 text-[#2E7D32] dark:text-emerald-400 rounded-xl">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Recently Added</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Fresh venue listings published by turf owners
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {recentlyAddedTurfs.map((t) => (
                      <TurfCard
                        key={t.id}
                        turf={t}
                        onSelect={(turf) => {
                          setSelectedTurf(turf);
                          setShowDetailModal(true);
                        }}
                        onBookNow={(turf) => {
                          setSelectedTurf(turf);
                          setShowDetailModal(true);
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer
        onSelectSport={(sport) => setFilters({ ...filters, selectedSport: sport })}
        onOpenTOS={() => setShowTOSModal(true)}
        onOpenAuth={(role) => {
          if (role) setAuthRoleTarget(role);
          setShowAuthModal(true);
        }}
      />

      {/* MODALS */}

      {/* Role Selection Initial Modal */}
      <RoleSelectionModal
        isOpen={showRoleSelectModal}
        onClose={() => setShowRoleSelectModal(false)}
        onSelectRole={(role) => {
          setShowRoleSelectModal(false);
          setAuthRoleTarget(role);
          setShowAuthModal(true);
        }}
      />

      {/* Auth Modal (User / Owner / Admin Login & Signup) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialRole={authRoleTarget}
        onLoginSuccess={handleLoginSuccess}
        onOpenTOS={() => setShowTOSModal(true)}
      />

      {/* Terms of Service Modal */}
      <TermsOfServiceModal
        isOpen={showTOSModal}
        onClose={() => setShowTOSModal(false)}
      />

      {/* Filter Drawer */}
      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        filters={filters}
        onChangeFilters={setFilters}
        onResetFilters={() =>
          setFilters({
            searchQuery: '',
            city: 'All',
            selectedSport: 'All',
            maxPrice: 3500,
            minRating: 0,
            isIndoorFilter: 'all',
            facilities: [],
          })
        }
      />

      {/* Turf Detail & Slot Booking Modal */}
      <TurfDetailModal
        turf={selectedTurf}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        user={user}
        onOpenAuth={() => {
          if (selectedTurf) {
            setPendingTurfForBooking(selectedTurf);
          }
          setShowDetailModal(false);
          setAuthRoleTarget('user');
          setShowAuthModal(true);
        }}
        onBookingCreated={() => {
          fetchNotifications();
        }}
      />

      {/* User Dashboard */}
      {showUserDashboard && user && (
        <UserDashboard
          user={user}
          onClose={() => setShowUserDashboard(false)}
        />
      )}

      {/* Owner Dashboard */}
      {showOwnerDashboard && user && (
        <OwnerDashboard
          user={user}
          initialTab={ownerInitialTab}
          highlightBookingId={ownerHighlightBookingId}
          onClose={() => {
            setShowOwnerDashboard(false);
            setOwnerHighlightBookingId(undefined);
          }}
        />
      )}

      {/* Admin Dashboard */}
      {showAdminDashboard && user && (
        <AdminDashboard
          user={user}
          onClose={() => setShowAdminDashboard(false)}
        />
      )}

      {/* Interactive Foreground Live Notification Toast */}
      {foregroundToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500 shadow-2xl flex items-start gap-3 text-slate-800 dark:text-slate-100">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400 shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black truncate">{foregroundToast.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {foregroundToast.body}
              </p>
              {user?.role === 'owner' && (
                <button
                  onClick={() => {
                    setOwnerInitialTab('bookings');
                    if (foregroundToast.bookingId) {
                      setOwnerHighlightBookingId(foregroundToast.bookingId);
                    }
                    setShowOwnerDashboard(true);
                    setForegroundToast(null);
                  }}
                  className="mt-2 text-xs font-bold text-[#2E7D32] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Booking Request</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => setForegroundToast(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
