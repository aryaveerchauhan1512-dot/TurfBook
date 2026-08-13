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
  Image as ImageIcon
} from 'lucide-react';
import { Turf, Booking, User, Slot, TurfFacility, SportType } from '../types';
import { ALL_INDIAN_DISTRICTS_FORMATTED } from '../data/indianDistricts';

interface OwnerDashboardProps {
  user: User;
  onClose: () => void;
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

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, onClose }) => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'turfs' | 'bookings' | 'calendar' | 'qr'>('turfs');

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

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      const [turfsRes, bookingsRes] = await Promise.all([
        fetch('/api/turfs'),
        fetch(`/api/bookings/owner/${encodeURIComponent(user.id)}`),
      ]);
      const turfsData = turfsRes.ok ? await turfsRes.json() : [];
      const bookingsData = bookingsRes.ok ? await bookingsRes.json() : [];

      const myTurfs = Array.isArray(turfsData) ? turfsData.filter((t: Turf) => t.ownerId === user.id) : [];
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
  }, [user.id]);

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
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
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
    // Add high quality fallback sports image
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save turf.');

      setShowTurfModal(false);
      fetchOwnerData();
    } catch (err: any) {
      setImageError(err.message);
    } finally {
      setSavingTurf(false);
    }
  };

  // Delete / Unpost Turf
  const handleDeleteTurf = async (turfId: string) => {
    if (!confirm('Are you sure you want to unpost this turf listing?')) return;
    try {
      await fetch(`/api/turfs/${turfId}`, { method: 'DELETE' });
      fetchOwnerData();
    } catch (err) {
      console.error('Error deleting turf:', err);
    }
  };

  // Accept Booking Action (With mandatory confirmation)
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

  // Reject Booking Action (With mandatory confirmation)
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

  // Unbook Booked Slot Action (Allows owner to release booked slot if customer calls)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#43A047] flex items-center justify-center font-black">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Turf Owner Portal</h2>
                <p className="text-xs text-slate-500">
                  {user.businessName || user.name} • {turfs.length} Active Listings
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddTurf}
              className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Turf</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Dashboard Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/70 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Listings</span>
            <p className="text-base font-black text-slate-800">{turfs.length}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-600">Pending Requests</span>
            <p className="text-base font-black text-amber-600">{pendingBookings.length}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-[#2E7D32]">Approved Slots</span>
            <p className="text-base font-black text-[#2E7D32]">{approvedBookings.length}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-[#2E7D32]">Total Revenue</span>
            <p className="text-base font-black text-[#2E7D32]">₹{totalRevenue}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-white border-b border-slate-100 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('turfs')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'turfs'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            My Turf Listings ({turfs.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all relative ${
              activeTab === 'bookings'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
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
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'calendar'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Interactive Calendar & Slot Blocker
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'qr'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Payment QR & Phone Settings
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: MY TURF LISTINGS */}
          {activeTab === 'turfs' && (
            <div className="space-y-4">
              {turfs.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl p-6">
                  <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-slate-700">No Turf Listings Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Publish your sports turf with at least 3 photos to start receiving instant player bookings.
                  </p>
                  <button
                    onClick={handleOpenAddTurf}
                    className="px-5 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Add Turf Listing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {turfs.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-3xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            t.images[0] ||
                            'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={t.name}
                          className="w-24 h-20 rounded-2xl object-cover shrink-0 border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 bg-emerald-50 text-[#2E7D32] rounded-md text-[10px] font-bold">
                              {t.images.length} Photos
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {t.city}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-800 line-clamp-1">
                            {t.name}
                          </h4>
                          <p className="text-xs text-[#2E7D32] font-black mt-1">
                            ₹{t.pricePerHour} / hour
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                        <button
                          onClick={() => {
                            setSelectedTurfForSlots(t);
                            setActiveTab('calendar');
                          }}
                          className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Manage Calendar Slots</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTurf(t.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Unpost Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
              <h3 className="text-sm font-bold text-slate-800">Pending Approval Requests ({pendingBookings.length})</h3>

              {pendingBookings.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  No pending booking requests right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-lg text-[10px] font-black uppercase">
                            Pending Request
                          </span>
                          <span className="text-xs font-bold text-slate-700">{bk.sport}</span>
                        </div>
                        <p className="text-sm font-black text-slate-800">{bk.userName}</p>
                        <p className="text-xs text-slate-600 font-semibold">
                          {bk.turfName} • {bk.date} ({bk.time})
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          User Phone: {bk.userPhone || 'Provided upon booking'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRejectBookingTarget(bk)}
                          className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => setAcceptBookingTarget(bk)}
                          className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                        >
                          Accept Booking
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* APPROVED BOOKINGS SECTION WITH UNBOOK OPTION */}
              <h3 className="text-sm font-bold text-slate-800 pt-4 border-t border-slate-200">
                Approved Active Bookings ({approvedBookings.length})
              </h3>
              {approvedBookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No approved bookings yet.</div>
              ) : (
                <div className="space-y-3">
                  {approvedBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-lg text-[10px] font-black uppercase">
                            Approved
                          </span>
                          <span className="text-xs font-bold text-slate-700">{bk.sport}</span>
                        </div>
                        <p className="text-sm font-black text-slate-800">{bk.userName}</p>
                        <p className="text-xs text-slate-600">
                          {bk.turfName} • {bk.date} ({bk.time})
                        </p>
                        <p className="text-xs font-bold text-[#2E7D32] mt-0.5">₹{bk.totalAmount}</p>
                      </div>

                      <button
                        onClick={() => setUnbookTarget(bk)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                      >
                        Unbook Slot (Customer Called)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTERACTIVE CALENDAR & SLOT BLOCKER */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">Select Turf:</label>
                  <select
                    value={selectedTurfForSlots?.id || ''}
                    onChange={(e) => {
                      const found = turfs.find((t) => t.id === e.target.value);
                      if (found) setSelectedTurfForSlots(found);
                    }}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {turfs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">Date:</label>
                  <input
                    type="date"
                    value={calendarDate}
                    onChange={(e) => setCalendarDate(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Click any slot below to Block / Unblock slot
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {calendarSlots.map((slot) => {
                    const isBlocked = slot.status === 'blocked';
                    const isBooked = slot.status === 'booked';
                    const isPending = slot.status === 'pending';

                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleToggleSlotBlock(slot)}
                        disabled={isBooked || isPending}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isBlocked
                            ? 'bg-slate-800 text-white border-slate-900'
                            : isBooked
                            ? 'bg-rose-100 text-rose-900 border-rose-300 cursor-not-allowed'
                            : isPending
                            ? 'bg-amber-100 text-amber-900 border-amber-300 cursor-not-allowed'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        <span className="text-xs font-black block">{slot.time}</span>
                        <span className="text-[10px] font-bold uppercase mt-1 block">
                          {slot.status}
                        </span>
                        <span className="text-[9px] block mt-0.5 opacity-70">
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
            <form noValidate onSubmit={handleSaveQrAndPhone} className="max-w-md mx-auto space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <h3 className="text-base font-black text-slate-800">Owner Contact & Payment QR Code</h3>
              <p className="text-xs text-slate-500">
                This phone number and QR code will be revealed strictly to players when you approve their booking request.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner Contact Phone Number *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UPI Payment QR Code (Image URL or Data URL)</label>
                <input
                  type="text"
                  value={paymentQrUrl}
                  onChange={(e) => setPaymentQrUrl(e.target.value)}
                  placeholder="Paste SVG / Image URL for QR Code"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={savingQr}
                className="w-full py-3 bg-[#2E7D32] text-white font-bold text-xs rounded-xl shadow-md"
              >
                {savingQr ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ADD / EDIT TURF MODAL (WITH MANDATORY MIN 3 IMAGES VALIDATION) */}
      {showTurfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowTurfModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-1">
              {editingTurf ? 'Edit Turf Details' : 'Add New Sports Turf'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Minimum 3 uploaded photos required before publishing.
            </p>

            {imageError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{imageError}</span>
              </div>
            )}

            <form noValidate onSubmit={handleSaveTurf} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Turf Name *</label>
                  <input
                    type="text"
                    required
                    value={turfName}
                    onChange={(e) => setTurfName(e.target.value)}
                    placeholder="e.g. Champions Futsal Turf"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / District *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold max-h-48"
                  >
                    {ALL_INDIAN_DISTRICTS_FORMATTED.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Venue Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 102, Bandra West"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hourly Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="300"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Sports checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supported Sports *</label>
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
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                          selected
                            ? 'bg-[#2E7D32] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MANDATORY PHOTO UPLOAD CONTAINER (MIN 3, MAX 15) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">
                    Turf Photos (Min: 3 | Max: 15) *
                  </label>
                  <span className={`text-xs font-bold ${uploadedImages.length >= 3 ? 'text-[#2E7D32]' : 'text-rose-600'}`}>
                    {uploadedImages.length} / 15 Uploaded
                  </span>
                </div>

                {/* Drag & Drop Box */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleImageFileDrop}
                  className="p-4 border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50/50 text-center cursor-pointer hover:bg-emerald-100/50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-[#2E7D32] mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Drag & Drop Turf Photos Here</p>
                  <p className="text-[10px] text-slate-400">or enter image link below</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Paste Image URL (Unsplash or direct image link)"
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl"
                  >
                    Add Image
                  </button>
                </div>

                {/* Image Previews */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative h-20 rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
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
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTurf}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#2E7D32] rounded-xl shadow-md"
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <CheckCircle className="w-10 h-10 text-[#2E7D32] mx-auto mb-2" />
            <h3 className="text-base font-black text-slate-800">Accept this booking?</h3>
            <p className="text-xs text-slate-500 my-2">
              This slot will immediately become unavailable to all other players, and your contact phone & QR code will be unlocked for the customer.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setAcceptBookingTarget(null)}
                className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAcceptBooking}
                disabled={actionLoading}
                className="py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl shadow-md"
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-base font-black text-slate-800">Reject booking request?</h3>
            <p className="text-xs text-slate-500 my-2">
              The booking request will be declined and the slot will automatically become available again.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setRejectBookingTarget(null)}
                className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectBooking}
                disabled={actionLoading}
                className="py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md"
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <h3 className="text-base font-black text-slate-800">Unbook this slot?</h3>
            <p className="text-xs text-slate-500 my-2">
              Use this if the customer called you to cancel their booking. The slot will become available again immediately.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setUnbookTarget(null)}
                className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnbookSlot}
                disabled={actionLoading}
                className="py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md"
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
