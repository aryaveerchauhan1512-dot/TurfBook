import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Phone,
  QrCode,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Upload,
  MessageSquare,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Booking, User } from '../types';

interface UserDashboardProps {
  user: User;
  onClose: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, onClose }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // QR Modal
  const [viewQrBooking, setViewQrBooking] = useState<Booking | null>(null);

  // Review Modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Cancel Confirm Modal
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    if (!user || !user.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/user/${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) {
          setBookings(data);
        }
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user.id]);

  // Cancel Request Action
  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    setCancelling(true);

    try {
      await fetch(`/api/bookings/${cancelBookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      setCancelBookingId(null);
      fetchBookings();
    } catch (err) {
      console.error('Cancel booking error:', err);
    } finally {
      setCancelling(false);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;

    setSubmittingReview(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turfId: reviewBooking.turfId,
          userId: user.id,
          userName: user.name,
          userImage: user.avatarUrl,
          bookingId: reviewBooking.id,
          rating,
          comment,
          images: reviewPhoto ? [reviewPhoto] : [],
        }),
      });

      setReviewBooking(null);
      setComment('');
      setReviewPhoto('');
      fetchBookings();
    } catch (err) {
      console.error('Submit review error:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'approved'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'rejected' || b.status === 'cancelled'
  );

  const displayedList = activeTab === 'active' ? activeBookings : pastBookings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400 flex items-center justify-center font-black">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Player Dashboard</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email} • {user.phone || 'Phone encrypted'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBookings}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Refresh Bookings"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'border-[#2E7D32] dark:border-emerald-400 text-[#2E7D32] dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Active & Pending Bookings ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#2E7D32] dark:border-emerald-400 text-[#2E7D32] dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Past & Cancelled ({pastBookings.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading your bookings...</div>
          ) : displayedList.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No {activeTab} bookings found</p>
              <p className="text-xs text-slate-400 mt-1">Book your favorite sports turf from the landing page!</p>
            </div>
          ) : (
            displayedList.map((bk) => {
              const isApproved = bk.status === 'approved';
              const isPending = bk.status === 'pending';

              return (
                <div
                  key={bk.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    isApproved
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-xs'
                      : isPending
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={bk.turfImage || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=300&q=80'}
                        alt={bk.turfName}
                        className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                              isApproved
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-[#2E7D32] dark:text-emerald-400'
                                : isPending
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {bk.status}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {bk.sport}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{bk.turfName}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#2E7D32] dark:text-emerald-400" />
                            {bk.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#2E7D32] dark:text-emerald-400" />
                            {bk.time}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-left md:text-right flex flex-col justify-between md:items-end gap-2">
                      <span className="text-lg font-black text-[#2E7D32] dark:text-emerald-400">₹{bk.totalAmount}</span>

                      <div className="flex items-center gap-2">
                        {/* Cancel Button */}
                        {(isPending || isApproved) && (
                          <button
                            onClick={() => setCancelBookingId(bk.id)}
                            className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 bg-rose-50 dark:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          >
                            Cancel Booking
                          </button>
                        )}

                        {/* Leave Review button if approved */}
                        {isApproved && (
                          <button
                            onClick={() => setReviewBooking(bk)}
                            className="px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>Leave Review</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CRITICAL REVEAL: Owner Phone & Payment QR code unlocked exclusively on APPROVED status */}
                  {isApproved && (
                    <div className="mt-4 pt-4 border-t border-emerald-200/80 dark:border-emerald-800 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#2E7D32] dark:text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Owner Approved! Contact & Payment Details Unlocked</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-between border border-emerald-100 dark:border-emerald-800">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Owner Contact Phone</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{bk.ownerPhone || '+91 98765 43210'}</span>
                          </div>
                          <a
                            href={`tel:${bk.ownerPhone}`}
                            className="p-2 bg-[#2E7D32] text-white rounded-lg hover:bg-[#1b4d1f] transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>

                        {bk.ownerPaymentQrUrl && (
                          <button
                            onClick={() => setViewQrBooking(bk)}
                            className="p-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl flex items-center justify-between border border-emerald-100 dark:border-emerald-800 transition-colors cursor-pointer text-left"
                          >
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Owner Payment QR</span>
                              <span className="font-bold text-[#2E7D32] dark:text-emerald-400 text-xs">Click to View QR Code ➔</span>
                            </div>
                            <QrCode className="w-6 h-6 text-[#2E7D32] dark:text-emerald-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* QR Code Viewer Modal */}
      {viewQrBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center relative animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setViewQrBooking(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">Owner Payment QR Code</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{viewQrBooking.turfName}</p>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 inline-block mb-3">
              <img
                src={viewQrBooking.ownerPaymentQrUrl}
                alt="Payment QR Code"
                className="w-48 h-48 object-contain mx-auto"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mb-4">
              Scan with any UPI App (GPay, PhonePe, Paytm) to transfer ₹{viewQrBooking.totalAmount}
            </p>

            <button
              onClick={() => setViewQrBooking(null)}
              className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setReviewBooking(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">Leave a Review</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{reviewBooking.turfName}</p>

            <form noValidate onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Your Comment</label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience at this turf..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Photo (Optional)
                </label>
                <input
                  type="text"
                  value={reviewPhoto}
                  onChange={(e) => setReviewPhoto(e.target.value)}
                  placeholder="Paste image URL (optional)"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1b4d1f] rounded-xl shadow-md cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {cancelBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Cancel Booking Request?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 my-2">
              Are you sure you want to cancel this booking request? The slot will immediately become available again.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setCancelBookingId(null)}
                className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
