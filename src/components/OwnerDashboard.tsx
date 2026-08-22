import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  QrCode,
  Phone,
  DollarSign,
  Upload,
  X,
  AlertCircle,
  Shield,
  Star,
  Eye,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Bell,
  BellRing,
  BellOff,
  Send,
  CheckCircle2,
  Smartphone,
  Globe,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Turf, Booking, User, Slot, TurfFacility, SportType } from '../types';
import { ALL_INDIAN_DISTRICTS_FORMATTED } from '../data/indianDistricts';
import {
  isPushNotificationSupported,
  requestOwnerFcmToken,
  saveTokenToBackend,
  removeTokenFromBackend,
} from '../lib/fcmClient';

interface OwnerDashboardProps {
  user: User;
  onClose: () => void;
  initialTab?: 'turfs' | 'bookings' | 'calendar' | 'qr' | 'notifications';
  highlightBookingId?: string;
}

const ALL_SPORTS: SportType[] = [
  'Football',
  'Cricket',
  'Badminton',
  'Tennis',
  'Basketball',
  'Volleyball',
  'Pickleball',
  'Table Tennis',
  'Squash',
  'Hockey',
  'Futsal',
];

const ALL_FACILITIES: TurfFacility[] = [
  'AC',
  'Floodlights',
  'Parking',
  'Washrooms',
  'Cafeteria',
  'Changing Rooms',
];

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  user,
  onClose,
  initialTab = 'turfs',
  highlightBookingId,
}) => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'turfs' | 'bookings' | 'calendar' | 'qr' | 'notifications'
  >(initialTab);

  // Selected turf for slot calendar management
  const [selectedTurfForSlots, setSelectedTurfForSlots] = useState<Turf | null>(null);
  const [calendarSlots, setCalendarSlots] = useState<Slot[]>([]);
  const [calendarDate, setCalendarDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Add / Edit Turf Modal
  const [showTurfModal, setShowTurfModal] = useState(false);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);

  // Form Fields for Turf Creation (Mandatory Min 3 images)
  const [turfName, setTurfName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [pricePerHour, setPricePerHour] = useState(1500);
  const [isIndoor, setIsIndoor] = useState(false);
  const [selectedSports, setSelectedSports] = useState<SportType[]>(['Football', 'Futsal']);
  const [selectedFacilities, setSelectedFacilities] = useState<TurfFacility[]>([
    'Floodlights',
    'Parking',
    'Washrooms',
  ]);

  // Image Upload State (Min 3, Max 15)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [savingTurf, setSavingTurf] = useState(false);

  // QR Code and Phone state
  const [ownerPhone, setOwnerPhone] = useState(user.phone || '');
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [savingQr, setSavingQr] = useState(false);

  // Confirmation Modals for Booking Actions
  const [acceptBookingTarget, setAcceptBookingTarget] = useState<Booking | null>(null);
  const [rejectBookingTarget, setRejectBookingTarget] = useState<Booking | null>(null);
  const [unbookTarget, setUnbookTarget] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // FCM Push Notifications State
  const [pushSupported, setPushSupported] = useState<boolean>(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);
  const [pushTokenCount, setPushTokenCount] = useState<number>(0);
  const [isServerConfigured, setIsServerConfigured] = useState<boolean>(false);
  const [pushLoading, setPushLoading] = useState<boolean>(false);
  const [testPushLoading, setTestPushLoading] = useState<boolean>(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      const [turfsRes, bookingsRes, fcmRes] = await Promise.all([
        fetch('/api/turfs'),
        fetch(`/api/bookings/owner/${encodeURIComponent(user.id)}`),
        fetch(`/api/notifications/fcm-status/${encodeURIComponent(user.id)}`),
      ]);
      const turfsData = turfsRes.ok ? await turfsRes.json() : [];
      const bookingsData = bookingsRes.ok ? await bookingsRes.json() : [];

      if (fcmRes.ok) {
        const fcmData = await fcmRes.json();
        setPushEnabled(fcmData.enabled);
        setPushTokenCount(fcmData.tokenCount);
        setIsServerConfigured(fcmData.isServerConfigured);
      }

      const myTurfs = Array.isArray(turfsData)
        ? turfsData.filter((t: Turf) => t.ownerId === user.id)
        : [];
      setTurfs(myTurfs);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);

      if (myTurfs.length > 0 && !selectedTurfForSlots) {
        setSelectedTurfForSlots(myTurfs[0]);
      }
    } catch (err) {
      console.error('Error fetching owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
    // Check browser notification support & permission
    const supported = isPushNotificationSupported();
    setPushSupported(supported);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, [user.id]);

  // If highlightBookingId is passed, switch to bookings tab
  useEffect(() => {
    if (highlightBookingId) {
      setActiveTab('bookings');
    }
  }, [highlightBookingId]);

  // Fetch Slots for Owner Calendar View
  const fetchCalendarSlots = async () => {
    if (!selectedTurfForSlots) return;
    try {
      const res = await fetch(
        `/api/turfs/${selectedTurfForSlots.id}/slots?date=${calendarDate}`
      );
      const data = await res.json();
      setCalendarSlots(data);
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  useEffect(() => {
    fetchCalendarSlots();
  }, [selectedTurfForSlots?.id, calendarDate]);

  // Enable Push Notifications
  const handleEnablePushNotifications = async () => {
    setPushLoading(true);
    setPushError(null);
    setPushSuccess(null);

    try {
      const result = await requestOwnerFcmToken();
      setPushPermission(result.permission);

      if (!result.success || !result.token) {
        setPushError(
          result.error ||
            'Failed to obtain FCM registration token. Please check notification permissions.'
        );
        return;
      }

      setCurrentToken(result.token);

      // Save token securely to backend database associated with owner account
      const saved = await saveTokenToBackend(user.id, result.token, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
      if (saved.success) {
        setPushEnabled(true);
        setPushTokenCount((prev) => (prev > 0 ? prev : 1));
        setPushSuccess(
          '🎉 Firebase Cloud Messaging push notifications enabled! You will now receive real-time alerts whenever a customer requests a booking, even when your tab is closed.'
        );
      } else {
        setPushError(saved.error || 'Failed to save push token to server database.');
      }
    } catch (err: any) {
      console.error('[FCM] Enable notification error:', err);
      setPushError(err?.message || 'An unexpected error occurred while enabling push notifications.');
    } finally {
      setPushLoading(false);
    }
  };

  // Disable Push Notifications
  const handleDisablePushNotifications = async () => {
    setPushLoading(true);
    setPushError(null);
    setPushSuccess(null);

    try {
      if (currentToken) {
        await removeTokenFromBackend(user.id, currentToken, user.email);
      }
      setPushEnabled(false);
      setPushTokenCount(0);
      setPushSuccess('Push notifications have been disabled for this account.');
    } catch (err: any) {
      console.error('[FCM] Disable notification error:', err);
      setPushError('Failed to disable notifications.');
    } finally {
      setPushLoading(false);
    }
  };

  // Send Test Push Notification
  const handleSendTestPush = async () => {
    setTestPushLoading(true);
    setPushError(null);
    setPushSuccess(null);

    try {
      const res = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPushError(data.error || 'Failed to dispatch test push notification via FCM.');
      } else {
        setPushSuccess(
          `🚀 Test push notification dispatched successfully to ${data.sentCount} active device(s)! Look for the browser banner.`
        );
      }
    } catch (err: any) {
      console.error('[FCM] Test push error:', err);
      setPushError(`Error sending test push: ${err?.message || 'Network error'}`);
    } finally {
      setTestPushLoading(false);
    }
  };

  // Toggle Slot Status on Calendar (Block / Unblock)
  const handleToggleSlotBlock = async (slot: Slot) => {
    const nextStatus = slot.status === 'blocked' ? 'available' : 'blocked';
    try {
      await fetch(`/api/turfs/${slot.turfId}/slots/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slot.id, status: nextStatus }),
      });
      fetchCalendarSlots();
    } catch (err) {
      console.error('Error toggling slot:', err);
    }
  };

  // Open Turf Modal for Adding
  const handleOpenAddTurf = () => {
    setEditingTurf(null);
    setTurfName('');
    setTagline('');
    setDescription('');
    setAddress('');
    setCity('Mumbai');
    setPricePerHour(1500);
    setIsIndoor(false);
    setSelectedSports(['Football', 'Futsal']);
    setSelectedFacilities(['Floodlights', 'Parking', 'Washrooms']);
    setUploadedImages([
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
    ]);
    setImageError(null);
    setShowTurfModal(true);
  };

  // Add image URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput) return;
    if (uploadedImages.length >= 15) {
      setImageError('Maximum 15 photos allowed per turf.');
      return;
    }
    setUploadedImages([...uploadedImages, imageUrlInput]);
    setImageUrlInput('');
    setImageError(null);
  };

  // Remove Image
  const handleRemoveImage = (index: number) => {
    const updated = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updated);
    if (updated.length < 3) {
      setImageError('Minimum 3 images are required for publication.');
    }
  };

  // Drag & drop image simulation handler
  const handleImageFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (uploadedImages.length >= 15) return;
    const sampleImages = [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
    ];
    const newImg = sampleImages[uploadedImages.length % sampleImages.length];
    setUploadedImages([...uploadedImages, newImg]);
    setImageError(null);
  };

  // Save Turf (Enforces min 3, max 15 images)
  const handleSaveTurf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedImages.length < 3) {
      setImageError('Mandatory Requirement: You must upload at least 3 photos before publishing.');
      return;
    }

    setSavingTurf(true);
    setImageError(null);

    try {
      const payload = {
        ownerId: user.id,
        ownerName: user.name,
        name: turfName,
        tagline,
        description,
        address,
        city,
        sports: selectedSports,
        isIndoor,
        pricePerHour: Number(pricePerHour),
        images: uploadedImages,
        facilities: selectedFacilities,
      };

      const res = await fetch(editingTurf ? `/api/turfs/${editingTurf.id}` : '/api/turfs', {
        method: editingTurf ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save turf');
      }

      setShowTurfModal(false);
      fetchOwnerData();
    } catch (err: any) {
      setImageError(err.message || 'Error saving turf listing');
    } finally {
      setSavingTurf(false);
    }
  };

  // Confirm Accept Booking
  const handleConfirmAcceptBooking = async () => {
    if (!acceptBookingTarget) return;
    setActionLoading(true);

    try {
      await fetch(`/api/bookings/${acceptBookingTarget.id}/approve`, {
        method: 'POST',
      });
      setAcceptBookingTarget(null);
      fetchOwnerData();
    } catch (err) {
      console.error('Error approving booking:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Reject Booking
  const handleConfirmRejectBooking = async () => {
    if (!rejectBookingTarget) return;
    setActionLoading(true);

    try {
      await fetch(`/api/bookings/${rejectBookingTarget.id}/reject`, {
        method: 'POST',
      });
      setRejectBookingTarget(null);
      fetchOwnerData();
    } catch (err) {
      console.error('Error rejecting booking:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Unbook Slot
  const handleConfirmUnbookSlot = async () => {
    if (!unbookTarget) return;
    setActionLoading(true);

    try {
      await fetch(`/api/bookings/${unbookTarget.id}/unbook`, {
        method: 'POST',
      });
      setUnbookTarget(null);
      fetchOwnerData();
    } catch (err) {
      console.error('Error unbooking slot:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Save QR Code and Phone
  const handleSaveQrAndPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQr(true);

    try {
      await fetch('/api/owner/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.id,
          phone: ownerPhone,
          paymentQrUrl: paymentQrUrl || undefined,
        }),
      });
      alert('Phone & Payment QR Code updated successfully!');
      fetchOwnerData();
    } catch (err) {
      console.error('Error saving QR code:', err);
    } finally {
      setSavingQr(false);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const approvedBookings = bookings.filter((b) => b.status === 'approved');
  const totalRevenue = approvedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400 flex items-center justify-center font-black text-base shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">
                    Turf Owner Portal
                  </h2>
                  {pushEnabled ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Push Alerts Active
                    </span>
                  ) : (
                    <button
                      onClick={handleEnablePushNotifications}
                      disabled={pushLoading}
                      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      <BellRing className="w-3 h-3 text-amber-600" />
                      Enable Push Notifications
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.businessName || user.name} • {turfs.length} Active Listings
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddTurf}
              className="px-3.5 sm:px-4 py-2 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Turf</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* PROMINENT PUSH NOTIFICATIONS BANNER (When not enabled) */}
        {!pushEnabled && (
          <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-amber-50 via-emerald-50 to-amber-50 dark:from-slate-800/90 dark:via-emerald-950/40 dark:to-slate-800/90 border-b border-amber-200/70 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  Instant Booking Alerts:
                </span>{' '}
                <span className="text-slate-600 dark:text-slate-300">
                  Enable browser push notifications to get alerted via FCM when a player books a slot.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleEnablePushNotifications}
                disabled={pushLoading}
                className="px-3.5 py-1.5 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {pushLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )}
                <span>{pushLoading ? 'Registering...' : 'Enable Notifications'}</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className="px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 font-semibold underline"
              >
                Settings
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3 sm:p-4 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              Total Listings
            </span>
            <p className="text-base font-black text-slate-800 dark:text-slate-100">
              {turfs.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
              Pending Requests
            </span>
            <p className="text-base font-black text-amber-600 dark:text-amber-400">
              {pendingBookings.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/60">
            <span className="text-[10px] uppercase font-bold text-[#2E7D32] dark:text-emerald-400">
              Approved Slots
            </span>
            <p className="text-base font-black text-[#2E7D32] dark:text-emerald-400">
              {approvedBookings.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/60">
            <span className="text-[10px] uppercase font-bold text-[#2E7D32] dark:text-emerald-400">
              Total Revenue
            </span>
            <p className="text-base font-black text-[#2E7D32] dark:text-emerald-400">
              ₹{totalRevenue}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('turfs')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'turfs'
                ? 'border-[#2E7D32] text-[#2E7D32] dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            My Turf Listings ({turfs.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'bookings'
                ? 'border-[#2E7D32] text-[#2E7D32] dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Booking Approvals Queue
            {pendingBookings.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black">
                {pendingBookings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'calendar'
                ? 'border-[#2E7D32] text-[#2E7D32] dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Interactive Calendar & Slot Blocker
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'qr'
                ? 'border-[#2E7D32] text-[#2E7D32] dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Payment QR & Phone Settings
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-[#2E7D32] text-[#2E7D32] dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Push Notifications</span>
            {pushEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: MY TURF LISTINGS */}
          {activeTab === 'turfs' && (
            <div className="space-y-4">
              {turfs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No turfs listed yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    List your sports arena with photos, pricing, and timing to start receiving booking requests from players.
                  </p>
                  <button
                    onClick={handleOpenAddTurf}
                    className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    Add Your First Turf
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {turfs.map((turf) => (
                    <div
                      key={turf.id}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 flex gap-4 shadow-xs"
                    >
                      <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700 relative">
                        <img
                          src={turf.images[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80'}
                          alt={turf.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-slate-950/70 text-white text-[9px] font-bold rounded-md">
                          {turf.images.length} Photos
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                              {turf.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-[#2E7D32] dark:text-emerald-300">
                              ₹{turf.pricePerHour}/hr
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {turf.address}, {turf.city}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {turf.sports.slice(0, 3).map((sp) => (
                              <span
                                key={sp}
                                className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold"
                              >
                                {sp}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-2">
                          <button
                            onClick={() => {
                              setSelectedTurfForSlots(turf);
                              setActiveTab('calendar');
                            }}
                            className="text-xs font-bold text-[#2E7D32] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Manage Slots</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BOOKING APPROVALS QUEUE */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No booking requests yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    When customers book your turf, their pending requests will show up here for you to accept or reject.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => {
                    const isPending = booking.status === 'pending';
                    const isApproved = booking.status === 'approved';
                    const isHighlighted = highlightBookingId === booking.id;

                    return (
                      <div
                        key={booking.id}
                        className={`p-4 rounded-3xl border transition-all ${
                          isHighlighted
                            ? 'ring-2 ring-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                            : isPending
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                            : isApproved
                            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                                    : isApproved
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {booking.status}
                              </span>
                              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                                {booking.turfName}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              📅 <strong>{booking.date}</strong> at <strong>{booking.time}</strong> • ⚽ {booking.sport} • ₹{booking.totalAmount}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Player: <strong>{booking.userName}</strong> ({booking.userEmail}) • Phone: {booking.userPhone || 'Provided upon booking'}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => setAcceptBookingTarget(booking)}
                                  className="px-3.5 py-1.5 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => setRejectBookingTarget(booking)}
                                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <button
                                onClick={() => setUnbookTarget(booking)}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                Cancel / Unbook Slot
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTERACTIVE CALENDAR & SLOT BLOCKER */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Turf:
                  </span>
                  <select
                    value={selectedTurfForSlots?.id || ''}
                    onChange={(e) => {
                      const t = turfs.find((item) => item.id === e.target.value);
                      if (t) setSelectedTurfForSlots(t);
                    }}
                    className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    {turfs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Date:
                  </span>
                  <input
                    type="date"
                    value={calendarDate}
                    onChange={(e) => setCalendarDate(e.target.value)}
                    className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Slot Grid */}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Click any slot to toggle between <strong>Available</strong> and <strong>Blocked</strong> (e.g. for maintenance or offline phone booking).
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {calendarSlots.map((slot) => {
                    const isBlocked = slot.status === 'blocked';
                    const isBooked = slot.status === 'booked' || slot.status === 'pending';

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => !isBooked && handleToggleSlotBlock(slot)}
                        disabled={isBooked}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isBlocked
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300'
                            : isBooked
                            ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-75'
                            : 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-900/60 text-[#2E7D32] dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-xs'
                        }`}
                      >
                        <p className="font-black text-xs">{slot.time}</p>
                        <p className="text-[10px] capitalize font-semibold mt-0.5">
                          {slot.status}
                        </p>
                        <span className="text-[9px] block text-slate-400 dark:text-slate-500 mt-1">
                          {isBlocked ? 'Click to Unblock' : isBooked ? 'Booked' : 'Click to Block'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENT QR & PHONE SETTINGS */}
          {activeTab === 'qr' && (
            <form
              noValidate
              onSubmit={handleSaveQrAndPhone}
              className="max-w-md mx-auto space-y-4 bg-slate-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                Owner Contact & Payment QR Code
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This phone number and QR code will be revealed strictly to players when you approve their booking request.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Owner Contact Phone Number *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  UPI Payment QR Code (Image URL or Data URL)
                </label>
                <input
                  type="text"
                  value={paymentQrUrl}
                  onChange={(e) => setPaymentQrUrl(e.target.value)}
                  placeholder="Paste SVG / Image URL for QR Code"
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={savingQr}
                className="w-full py-3 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                {savingQr ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          )}

          {/* TAB 5: PUSH NOTIFICATIONS & FCM SETTINGS */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Alert Feedback Messages */}
              {pushSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Success</p>
                    <p className="mt-0.5">{pushSuccess}</p>
                  </div>
                  <button
                    onClick={() => setPushSuccess(null)}
                    className="p-1 text-emerald-600 hover:text-emerald-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {pushError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Push Notification Notice</p>
                    <p className="mt-0.5">{pushError}</p>
                  </div>
                  <button
                    onClick={() => setPushError(null)}
                    className="p-1 text-rose-600 hover:text-rose-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Status Overview Card */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${
                      pushEnabled
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      <BellRing className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                        Browser Push Notifications (FCM)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Firebase Cloud Messaging Web Push Integration
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                        pushEnabled
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          pushEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      ></span>
                      {pushEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Diagnostics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Browser Support
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#2E7D32] dark:text-emerald-400" />
                      {pushSupported ? 'Supported' : 'Not Supported'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Permission State
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 capitalize flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#2E7D32] dark:text-emerald-400" />
                      {pushPermission}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Active Registered Devices
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {pushTokenCount} Device(s)
                    </p>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {!pushEnabled ? (
                    <button
                      onClick={handleEnablePushNotifications}
                      disabled={pushLoading}
                      className="flex-1 py-3 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {pushLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                      <span>
                        {pushLoading
                          ? 'Requesting Browser Permission...'
                          : 'Enable Browser Push Notifications'}
                      </span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSendTestPush}
                        disabled={testPushLoading}
                        className="flex-1 py-3 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {testPushLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>
                          {testPushLoading
                            ? 'Sending Test FCM Notification...'
                            : 'Send Test Push Notification'}
                        </span>
                      </button>

                      <button
                        onClick={handleDisablePushNotifications}
                        disabled={pushLoading}
                        className="py-3 px-5 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                      >
                        Disable Notifications
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* How it works Information Card */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                  <Info className="w-4 h-4 text-[#2E7D32] dark:text-emerald-400" />
                  <span>How TurfBook Push Notifications Work</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>
                    <strong>Immediate Delivery:</strong> When a customer submits a booking request, Firebase Cloud Messaging immediately sends a push notification to your registered browser.
                  </li>
                  <li>
                    <strong>Works in Background:</strong> Push notifications will reach your browser even when TurfBook is in a background tab or when the tab is closed.
                  </li>
                  <li>
                    <strong>Direct Link:</strong> Clicking the notification opens the TurfBook Owner Dashboard directly into your Booking Approvals queue.
                  </li>
                  <li>
                    <strong>Zero Email/Spam:</strong> Uses 100% native Web Push over HTTPS — no emails or custom polling scripts.
                  </li>
                </ul>
              </div>

              {/* Browser Permission Helper Guide */}
              {pushPermission === 'denied' && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-800 dark:text-rose-200 space-y-2">
                  <p className="font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    How to Unblock Notifications in your Browser:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Click the lock/settings icon next to the URL in your browser address bar.</li>
                    <li>Find <strong>Notifications</strong> and change it to <strong>Allow</strong>.</li>
                    <li>Reload the page and click <strong>Enable Notifications</strong> above.</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT TURF MODAL (WITH MANDATORY MIN 3 IMAGES VALIDATION) */}
      {showTurfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowTurfModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">
              {editingTurf ? 'Edit Turf Details' : 'Add New Sports Turf'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Minimum 3 uploaded photos required before publishing.
            </p>

            {imageError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{imageError}</span>
              </div>
            )}

            <form noValidate onSubmit={handleSaveTurf} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Turf Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={turfName}
                    onChange={(e) => setTurfName(e.target.value)}
                    placeholder="e.g. Champions Futsal Turf"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. FIFA Standard AstroTurf"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your venue, pitch dimensions, lighting, etc."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City / District *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  >
                    {ALL_INDIAN_DISTRICTS_FORMATTED.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hourly Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="300"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Venue Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 102, Bandra West"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Sports checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supported Sports *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SPORTS.map((sp) => {
                    const selected = selectedSports.includes(sp);
                    return (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setSelectedSports(selectedSports.filter((s) => s !== sp));
                          } else {
                            setSelectedSports([...selectedSports, sp]);
                          }
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#2E7D32] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {sp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MANDATORY PHOTO UPLOAD CONTAINER (MIN 3, MAX 15) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100">
                    Turf Photos (Min: 3 | Max: 15) *
                  </label>
                  <span
                    className={`text-xs font-bold ${
                      uploadedImages.length >= 3
                        ? 'text-[#2E7D32] dark:text-emerald-400'
                        : 'text-rose-600'
                    }`}
                  >
                    {uploadedImages.length} / 15 Uploaded
                  </span>
                </div>

                {/* Drag & Drop Box */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleImageFileDrop}
                  className="p-4 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-center cursor-pointer hover:bg-emerald-100/50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-[#2E7D32] dark:text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Drag & Drop Turf Photos Here
                  </p>
                  <p className="text-[10px] text-slate-400">or enter image link below</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Paste Image URL (Unsplash or direct image link)"
                    className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Add Image
                  </button>
                </div>

                {/* Image Previews */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTurfModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTurf}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1b4d1f] rounded-xl shadow-md cursor-pointer"
                >
                  {savingTurf ? 'Publishing...' : 'Publish Turf Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCEPT BOOKING CONFIRMATION MODAL */}
      {acceptBookingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <CheckCircle className="w-10 h-10 text-[#2E7D32] dark:text-emerald-400 mx-auto mb-2" />
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Accept this booking?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 my-2">
              This slot will immediately become unavailable to all other players, and your contact phone & QR code will be unlocked for the customer.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setAcceptBookingTarget(null)}
                className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAcceptBooking}
                disabled={actionLoading}
                className="py-2.5 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Accept Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT BOOKING CONFIRMATION MODAL */}
      {rejectBookingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Reject booking request?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 my-2">
              The booking request will be declined and the slot will automatically become available again.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setRejectBookingTarget(null)}
                className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectBooking}
                disabled={actionLoading}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNBOOK CONFIRMATION MODAL */}
      {unbookTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Unbook this slot?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 my-2">
              Use this if the customer called you to cancel their booking. The slot will become available again immediately.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setUnbookTarget(null)}
                className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnbookSlot}
                disabled={actionLoading}
                className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Unbook Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
