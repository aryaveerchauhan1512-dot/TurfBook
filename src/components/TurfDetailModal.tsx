import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Info,
  Navigation,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Turf, Slot, User, Review, SportType } from '../types';

interface TurfDetailModalProps {
  turf: Turf | null;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onBookingCreated: () => void;
}

export const TurfDetailModal: React.FC<TurfDetailModalProps> = ({
  turf,
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onBookingCreated,
}) => {
  if (!isOpen || !turf) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSport, setSelectedSport] = useState<SportType>(turf.sports[0] || 'Football');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Booking Confirmation Dialog State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);

  // Fetch slots for selected date
  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/turfs/${turf.id}/slots?date=${selectedDate}`);
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    // Poll slots every 5 seconds for live status updates!
    const interval = setInterval(fetchSlots, 5000);
    return () => clearInterval(interval);
  }, [turf.id, selectedDate]);

  // Handle Slot Click
  const handleSlotClick = (slot: Slot) => {
    if (slot.status !== 'available') return;
    if (!user) {
      onClose();
      onOpenAuth();
      return;
    }
    setSelectedSlot(slot);
    setShowConfirmModal(true);
  };

  // Submit Booking Request
  const handleConfirmSendRequest = async () => {
    if (!selectedSlot || !user) return;
    setSubmittingBooking(true);
    setBookingErrorMsg(null);

    try {
      const res = await fetch('/api/bookings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turfId: turf.id,
          slotId: selectedSlot.id,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone || '+91 98765 43210',
          sport: selectedSport,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking request.');
      }

      setShowConfirmModal(false);
      setBookingSuccessMsg(
        'Booking request submitted! Status changed to Pending Approval. Owner has been notified.'
      );
      fetchSlots();
      onBookingCreated();
    } catch (err: any) {
      setBookingErrorMsg(err.message);
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Date Buttons (Today, Tomorrow, Day After)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfterStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const dateOptions = [
    { label: 'Today', value: todayStr },
    { label: 'Tomorrow', value: tomorrowStr },
    { label: 'Day After', value: dayAfterStr },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 relative my-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {/* Top Gallery & Title */}
          <div>
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-900 mb-3">
              <img
                src={
                  turf.images[activeImageIndex] ||
                  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80'
                }
                alt={turf.name}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {turf.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === 0 ? turf.images.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full backdrop-blur-xs"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === turf.images.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full backdrop-blur-xs"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white">
                {activeImageIndex + 1} / {turf.images.length} Photos
              </div>
            </div>

            {/* Gallery Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {turf.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#2E7D32] scale-105 shadow-md'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Header Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 bg-emerald-50 text-[#2E7D32] rounded-xl text-xs font-bold uppercase">
                  {turf.isIndoor ? 'Indoor AC Arena' : 'Outdoor Turf'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  By {turf.ownerName}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-800">{turf.name}</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>{turf.address}, {turf.city} ({turf.distanceKm} km away)</span>
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 text-slate-800 mb-0.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-lg font-black">{turf.rating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({turf.reviewCount} reviews)</span>
              </div>
              <p className="text-xl font-black text-[#2E7D32]">
                ₹{turf.pricePerHour} <span className="text-xs text-slate-400 font-normal">/ hour</span>
              </p>
            </div>
          </div>

          {/* Description & Amenities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  About Venue
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{turf.description}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Supported Sports
                </h3>
                <div className="flex flex-wrap gap-2">
                  {turf.sports.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSport(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedSport === s
                          ? 'bg-[#2E7D32] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Facilities & Amenities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {turf.facilities.map((fac) => (
                    <div
                      key={fac}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
                      <span>{fac}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Google Maps Interactive Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-[#2E7D32]" />
                  <span>Google Maps Location</span>
                </h3>
                <div className="h-32 bg-emerald-900/10 rounded-xl overflow-hidden relative flex items-center justify-center text-center p-3 border border-emerald-200">
                  <div className="text-slate-600">
                    <MapPin className="w-8 h-8 text-[#2E7D32] mx-auto mb-1 animate-bounce" />
                    <span className="text-[11px] font-bold block">{turf.name}</span>
                    <span className="text-[9px] text-slate-400">{turf.address}</span>
                  </div>
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${turf.name} ${turf.address}`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl text-center block transition-colors"
              >
                Open in Google Maps ➔
              </a>
            </div>
          </div>

          {/* Slot Selection Section */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#2E7D32]" />
                  <span>Select Booking Slot</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Slots update automatically in real-time
                </p>
              </div>

              {/* Date Tabs */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedDate(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedDate === opt.value
                        ? 'bg-[#2E7D32] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 bg-white p-3 rounded-2xl border border-slate-200/80">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>🟢 Available</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span>🟡 Pending Approval</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span>🔴 Booked</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-800" />
                <span>⚫ Blocked by Owner</span>
              </span>
            </div>

            {bookingSuccessMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{bookingSuccessMsg}</span>
              </div>
            )}

            {/* Slot Grid */}
            {loadingSlots ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading live slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No slots configured for this date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {slots.map((slot) => {
                  let bgClass = 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 cursor-pointer';
                  let statusBadge = '🟢 Available';

                  if (slot.status === 'pending') {
                    bgClass = 'bg-amber-50 border-amber-300 text-amber-900 cursor-not-allowed opacity-90';
                    statusBadge = '🟡 Pending';
                  } else if (slot.status === 'booked') {
                    bgClass = 'bg-rose-50 border-rose-200 text-rose-800 cursor-not-allowed opacity-80';
                    statusBadge = '🔴 Booked';
                  } else if (slot.status === 'blocked') {
                    bgClass = 'bg-slate-200 border-slate-300 text-slate-700 cursor-not-allowed opacity-60';
                    statusBadge = '⚫ Blocked';
                  }

                  return (
                    <button
                      key={slot.id}
                      disabled={slot.status !== 'available'}
                      onClick={() => handleSlotClick(slot)}
                      className={`p-3 rounded-2xl border text-center transition-all ${bgClass}`}
                    >
                      <span className="text-xs font-black block">{slot.time}</span>
                      <span className="text-[10px] font-bold block mt-1">₹{slot.price}</span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold block mt-0.5 opacity-80">
                        {statusBadge}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {showConfirmModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Confirm Booking Request</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Are you sure you want to send this booking request?
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl text-left text-xs space-y-1 mb-5 border border-slate-200">
              <p><span className="font-bold text-slate-500">Turf:</span> {turf.name}</p>
              <p><span className="font-bold text-slate-500">Sport:</span> {selectedSport}</p>
              <p><span className="font-bold text-slate-500">Date & Time:</span> {selectedDate} ({selectedSlot.time})</p>
              <p><span className="font-bold text-slate-500">Amount:</span> ₹{selectedSlot.price}</p>
            </div>

            {bookingErrorMsg && (
              <p className="text-xs text-rose-600 mb-3 font-semibold">{bookingErrorMsg}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSendRequest}
                disabled={submittingBooking}
                className="py-2.5 px-4 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {submittingBooking ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Send Request</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
