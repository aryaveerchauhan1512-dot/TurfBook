import React, { useState, useEffect, useRef } from 'react';
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
  MessageCircle,
  Send,
  Ban,
  Check,
  CheckCheck
} from 'lucide-react';
import { Turf, Booking, User, Slot, TurfFacility, SportType, Conversation, ChatMessage } from '../types';
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
  const [activeTab, setActiveTab] = useState<'turfs' | 'bookings' | 'calendar' | 'messages' | 'qr'>('turfs');

  // Selected turf for slot calendar management
  const [selectedTurfForSlots, setSelectedTurfForSlots] = useState<Turf | null>(null);
  const [calendarSlots, setCalendarSlots] = useState<Slot[]>([]);
  const [calendarDate, setCalendarDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Slot Management Modal state (Available / Booked / Blocked)
  const [slotForManagement, setSlotForManagement] = useState<Slot | null>(null);
  const [slotStatusChoice, setSlotStatusChoice] = useState<'available' | 'booked' | 'blocked'>('available');
  const [slotBookedName, setSlotBookedName] = useState('');
  const [slotBookedPhone, setSlotBookedPhone] = useState('');
  const [savingSlotStatus, setSavingSlotStatus] = useState(false);
  const [slotPendingNotice, setSlotPendingNotice] = useState<Slot | null>(null);

  // Chat / Messages tab state
  const [ownerConversations, setOwnerConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

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
  const [compressingImages, setCompressingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      let turfsData: any[] = [];
      let bookingsData: any[] = [];
      try {
        const text = await turfsRes.text();
        turfsData = text ? JSON.parse(text) : [];
      } catch {
        turfsData = [];
      }
      try {
        const text = await bookingsRes.text();
        bookingsData = text ? JSON.parse(text) : [];
      } catch {
        bookingsData = [];
      }

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
      if (!res.ok) return;
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      setCalendarSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  useEffect(() => {
    fetchCalendarSlots();
  }, [selectedTurfForSlots?.id, calendarDate]);

  // Fetch Owner Conversations
  const fetchOwnerConversations = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/chat/conversations?userId=${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOwnerConversations(data);
          const totalUnread = data.reduce(
            (sum: number, c: Conversation) => sum + (c.unreadCountOwner || 0),
            0
          );
          setUnreadChatCount(totalUnread);
        }
      }
    } catch (err) {
      console.error('Error fetching owner conversations:', err);
    }
  };

  // Fetch messages for a specific conversation
  const fetchConversationMessages = async (convId: string, silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/chat/messages/${encodeURIComponent(convId)}?userId=${encodeURIComponent(user.id)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setConversationMessages(data);
        }
      }
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Poll conversations & messages
  useEffect(() => {
    fetchOwnerConversations();
    const interval = setInterval(() => {
      fetchOwnerConversations();
      if (selectedConversation) {
        fetchConversationMessages(selectedConversation.id, true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [user?.id, selectedConversation?.id]);

  // Send owner chat reply
  const handleSendOwnerReply = async () => {
    const text = chatInput.trim();
    if (!text || !selectedConversation || !user || sendingChat) return;

    setSendingChat(true);
    setChatInput('');

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConversation.id,
      turfId: selectedConversation.turfId,
      turfName: selectedConversation.turfName,
      senderId: user.id,
      senderName: user.name,
      senderRole: 'owner',
      recipientId: selectedConversation.playerId,
      recipientName: selectedConversation.playerName,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setConversationMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          turfId: selectedConversation.turfId,
          turfName: selectedConversation.turfName,
          turfImage: selectedConversation.turfImage,
          senderId: user.id,
          senderName: user.name,
          senderRole: 'owner',
          recipientId: selectedConversation.playerId,
          recipientName: selectedConversation.playerName,
          text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setConversationMessages((prev) =>
            prev.map((m) => (m.id === tempMsg.id ? data.message : m))
          );
        }
        fetchOwnerConversations();
      }
    } catch (err) {
      console.error('Error sending owner reply:', err);
    } finally {
      setSendingChat(false);
    }
  };

  // Open slot management modal
  const handleOpenSlotManagement = (slot: Slot) => {
    if (slot.status === 'pending') {
      setSlotPendingNotice(slot);
      return;
    }
    setSlotForManagement(slot);
    setSlotStatusChoice(
      slot.status === 'booked' ? 'booked' : slot.status === 'blocked' ? 'blocked' : 'available'
    );
    setSlotBookedName(slot.bookedByUserName || '');
    setSlotBookedPhone(slot.bookedByUserPhone || '');
  };

  // Save slot status
  const handleSaveSlotStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotForManagement) return;

    setSavingSlotStatus(true);
    try {
      const res = await fetch(`/api/turfs/${slotForManagement.turfId}/slots/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slotForManagement.id,
          status: slotStatusChoice,
          bookedByUserName:
            slotStatusChoice === 'booked'
              ? slotBookedName.trim() || 'Offline / Walk-in Player'
              : undefined,
          bookedByUserPhone:
            slotStatusChoice === 'booked' ? slotBookedPhone.trim() : undefined,
        }),
      });

      if (res.ok) {
        setSlotForManagement(null);
        fetchCalendarSlots();
      }
    } catch (err) {
      console.error('Error saving slot status:', err);
    } finally {
      setSavingSlotStatus(false);
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

  // Canvas-based image compression: scales images down to max 1280px dimension and converts to JPEG at quality 0.8
  // This prevents HTTP 413 Payload Too Large by reducing 5MB-10MB camera files to ~80KB-180KB while keeping crisp visual detail.
  const compressImageFile = (file: File, maxWidth = 1280, maxHeight = 960, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  // Compresses any large existing data URL if it exceeds 350KB
  const compressDataUrlIfNeeded = (dataUrl: string, maxWidth = 1280, maxHeight = 960, quality = 0.8): Promise<string> => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      return Promise.resolve(dataUrl);
    }
    if (dataUrl.length < 350000) {
      return Promise.resolve(dataUrl);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Process native image files or drop with automatic compression
  const handleProcessFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    const availableSlots = 15 - uploadedImages.length;
    if (availableSlots <= 0) {
      setImageError('Maximum 15 photos allowed per turf.');
      return;
    }

    const filesToRead = fileList.slice(0, availableSlots);
    setCompressingImages(true);
    setImageError(null);

    try {
      const compressedList = await Promise.all(
        filesToRead.map((file) => compressImageFile(file))
      );
      const validImages = compressedList.filter(Boolean);
      setUploadedImages((prev) => [...prev, ...validImages]);
      setImageError(null);
    } catch (err) {
      console.error('Error processing image files:', err);
      setImageError('Failed to process some photos. Please try again.');
    } finally {
      setCompressingImages(false);
    }
  };

  // Add image URL
  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (uploadedImages.length >= 15) {
      setImageError('Maximum 15 photos allowed per turf.');
      return;
    }
    setUploadedImages([...uploadedImages, trimmed]);
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

  // Drag & drop image handler (supports both real files and fallback simulation)
  const handleImageFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (uploadedImages.length >= 15) {
      setImageError('Maximum 15 photos allowed per turf.');
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    } else {
      const sampleImages = [
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
      ];
      const newImg = sampleImages[uploadedImages.length % sampleImages.length];
      setUploadedImages([...uploadedImages, newImg]);
      setImageError(null);
    }
  };

  // Save Turf (Enforces min 3, max 15 images with defensive response handling)
  const handleSaveTurf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) {
      setImageError('Please sign in as a Turf Owner to publish listings.');
      return;
    }
    if (!turfName.trim() || !address.trim() || !city.trim() || !pricePerHour) {
      setImageError('Please fill in all required fields (Turf Name, City, Venue Address, and Hourly Price).');
      return;
    }
    if (selectedSports.length === 0) {
      setImageError('Please select at least one supported sport.');
      return;
    }
    if (uploadedImages.length < 3) {
      setImageError('Mandatory Requirement: You must upload at least 3 photos before publishing.');
      return;
    }
    if (uploadedImages.length > 15) {
      setImageError('Maximum 15 photos allowed per turf.');
      return;
    }

    setSavingTurf(true);
    setImageError(null);

    try {
      // Ensure all images are compressed before sending over the wire
      const optimizedImages = await Promise.all(
        uploadedImages.map((img) => compressDataUrlIfNeeded(img))
      );

      const payload = {
        ownerId: user.id,
        ownerName: user.name,
        name: turfName.trim(),
        tagline: tagline.trim() || `${turfName.trim()} in ${city.trim()}`,
        description: description.trim() || 'Modern state-of-the-art sports turf with professional amenities.',
        address: address.trim(),
        city: city.trim(),
        sports: selectedSports,
        isIndoor: Boolean(isIndoor),
        pricePerHour: Number(pricePerHour),
        images: optimizedImages,
        facilities: selectedFacilities,
      };

      const res = await fetch(editingTurf ? `/api/turfs/${editingTurf.id}` : '/api/turfs', {
        method: editingTurf ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        if (res.status === 413) {
          throw new Error('The uploaded photos exceed server payload limits (413). Please delete a few photos or upload smaller ones.');
        }
        throw new Error(res.ok ? 'Server returned an invalid response format.' : `Failed to save turf (${res.status}). Please check network or try again.`);
      }

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('The uploaded photos exceed server payload limits (413). Please delete a few photos or upload smaller ones.');
        }
        throw new Error(data.error || 'Failed to save turf.');
      }

      setShowTurfModal(false);
      await fetchOwnerData();
    } catch (err: any) {
      setImageError(err?.message || 'Failed to save turf listing.');
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
            Slot Calendar & Availability
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all relative ${
              activeTab === 'messages'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Player Messages
            {unreadChatCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#2E7D32] text-white text-[9px] font-black">
                {unreadChatCount}
              </span>
            )}
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

          {/* TAB 3: INTERACTIVE CALENDAR & SLOT AVAILABILITY (BOOKED / BLOCKED / AVAILABLE) */}
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

              {/* Status Legend */}
              <div className="flex flex-wrap items-center gap-4 px-2 py-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                  <span className="font-semibold text-slate-600">Available (Online)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500"></span>
                  <span className="font-semibold text-slate-600">Booked (Offline / Online)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-slate-800"></span>
                  <span className="font-semibold text-slate-600">Blocked (Maintenance)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-500"></span>
                  <span className="font-semibold text-slate-600">Pending Request</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Click any slot to mark as Booked, Blocked, or Available
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {calendarSlots.length} Total Slots
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {calendarSlots.map((slot) => {
                    const isBlocked = slot.status === 'blocked';
                    const isBooked = slot.status === 'booked';
                    const isPending = slot.status === 'pending';

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleOpenSlotManagement(slot)}
                        className={`p-3 rounded-2xl border text-center transition-all relative group flex flex-col justify-between min-h-[90px] ${
                          isBlocked
                            ? 'bg-slate-800 text-white border-slate-900 hover:bg-slate-900 shadow-xs'
                            : isBooked
                            ? 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100/80 shadow-xs'
                            : isPending
                            ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 shadow-xs'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-black block tracking-tight">{slot.time}</span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md inline-block mt-1 ${
                              isBlocked
                                ? 'bg-slate-700 text-slate-200'
                                : isBooked
                                ? 'bg-rose-200/80 text-rose-800'
                                : isPending
                                ? 'bg-amber-200/80 text-amber-800'
                                : 'bg-emerald-200/80 text-emerald-800'
                            }`}
                          >
                            {slot.status}
                          </span>
                        </div>

                        <div className="mt-1">
                          {isBooked && slot.bookedByUserName && (
                            <span className="text-[9px] font-bold block truncate opacity-80" title={slot.bookedByUserName}>
                              👤 {slot.bookedByUserName}
                            </span>
                          )}
                          {!isBooked && !isBlocked && !isPending && (
                            <span className="text-[10px] font-black text-emerald-700 block">
                              ₹{slot.price}
                            </span>
                          )}
                          <span className="text-[8px] block opacity-60 group-hover:opacity-100 font-semibold underline mt-0.5">
                            {isPending ? 'View Request' : 'Manage Slot'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PLAYER MESSAGES / CHAT */}
          {activeTab === 'messages' && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden h-[540px] flex flex-col md:flex-row">
              {/* Left Column: Conversations */}
              <div
                className={`w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 ${
                  selectedConversation ? 'hidden md:flex' : 'flex'
                }`}
              >
                <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Inbox ({ownerConversations.length})
                  </h4>
                  <button
                    onClick={fetchOwnerConversations}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {ownerConversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <MessageCircle className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                      <p className="text-xs font-bold text-slate-600">No messages yet</p>
                      <p className="text-[11px] text-slate-400">
                        When players enquire about your turfs, their messages will appear here.
                      </p>
                    </div>
                  ) : (
                    ownerConversations.map((c) => {
                      const isSelected = selectedConversation?.id === c.id;
                      const unread = c.unreadCountOwner || 0;

                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedConversation(c);
                            fetchConversationMessages(c.id);
                          }}
                          className={`w-full p-3 text-left flex items-start gap-3 transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 border-l-4 border-[#2E7D32]'
                              : 'hover:bg-slate-100'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-slate-200 font-bold text-slate-600 flex items-center justify-center shrink-0 text-xs">
                            {c.playerName?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h5 className="text-xs font-bold text-slate-900 truncate">
                                {c.playerName}
                              </h5>
                              {c.lastMessageAt && (
                                <span className="text-[9px] text-slate-400 shrink-0">
                                  {new Date(c.lastMessageAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-emerald-700 font-bold truncate">
                              {c.turfName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate font-medium">
                              {c.lastMessage}
                            </p>
                          </div>
                          {unread > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#2E7D32] text-white text-[9px] font-black shrink-0">
                              {unread}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Chat Thread */}
              {selectedConversation ? (
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                  {/* Thread Header */}
                  <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-1 text-slate-500 rounded-lg"
                      >
                        ←
                      </button>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {selectedConversation.playerName}
                        </h4>
                        <p className="text-[10px] text-[#2E7D32] font-bold truncate">
                          Enquiring about: {selectedConversation.turfName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                    {loadingMessages ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#2E7D32] mr-2" />
                        Loading conversation...
                      </div>
                    ) : conversationMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        No messages in this chat.
                      </div>
                    ) : (
                      conversationMessages.map((msg) => {
                        const isOwner = msg.senderRole === 'owner';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[9px] font-bold text-slate-400 mb-0.5 px-1">
                              {isOwner ? 'You (Owner)' : msg.senderName} •{' '}
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <div
                              className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                                isOwner
                                  ? 'bg-[#2E7D32] text-white rounded-tr-xs'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Reply Input */}
                  <div className="p-3 border-t border-slate-200 bg-white">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendOwnerReply();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={`Reply to ${selectedConversation.playerName}...`}
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2E7D32]"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || sendingChat}
                        className="px-4 py-2.5 bg-[#2E7D32] hover:bg-[#256629] text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex flex-1 items-center justify-center text-center p-8 text-slate-400">
                  <div className="space-y-2">
                    <MessageCircle className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                    <h5 className="text-xs font-bold text-slate-700">Select a Player Conversation</h5>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Reply directly to players about slot availability, custom pricing, or facility queries.
                    </p>
                  </div>
                </div>
              )}
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
                  onClick={() => !compressingImages && fileInputRef.current?.click()}
                  className={`p-4 border-2 border-dashed rounded-xl text-center transition-colors ${
                    compressingImages
                      ? 'border-emerald-400 bg-emerald-100/50 cursor-wait'
                      : 'border-emerald-300 bg-emerald-50/50 cursor-pointer hover:bg-emerald-100/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    disabled={compressingImages}
                    onChange={(e) => {
                      if (e.target.files) handleProcessFiles(e.target.files);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  {compressingImages ? (
                    <div className="flex flex-col items-center justify-center py-2">
                      <RefreshCw className="w-6 h-6 text-[#2E7D32] animate-spin mb-1" />
                      <p className="text-xs font-bold text-slate-700">Optimizing photos for instant upload...</p>
                      <p className="text-[10px] text-slate-400">Resizing and compressing to keep listing fast & lightweight</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-[#2E7D32] mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-700">Click to Upload or Drag & Drop Turf Photos Here</p>
                      <p className="text-[10px] text-slate-400">JPG, PNG, WebP (Max 15) • Automatically compressed for fast loading</p>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
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
                  disabled={savingTurf || compressingImages}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#2E7D32] rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTurf ? 'Publishing...' : compressingImages ? 'Optimizing Photos...' : 'Publish Turf Listing'}
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

      {/* MANAGE SLOT AVAILABILITY MODAL (BOOKED / BLOCKED / AVAILABLE) */}
      {slotForManagement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Manage Slot Availability</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {slotForManagement.time} • {calendarDate}
                </p>
              </div>
              <button
                onClick={() => setSlotForManagement(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlotStatus} className="space-y-4">
              {/* Option 1: Available */}
              <label
                onClick={() => setSlotStatusChoice('available')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                  slotStatusChoice === 'available'
                    ? 'border-[#2E7D32] bg-emerald-50/70'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="mt-0.5">
                  <input
                    type="radio"
                    name="slotStatusChoice"
                    checked={slotStatusChoice === 'available'}
                    onChange={() => setSlotStatusChoice('available')}
                    className="accent-[#2E7D32] w-4 h-4"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Mark as Available
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Open for online bookings by players on TurfBook (₹{slotForManagement.price}/hr).
                  </p>
                </div>
              </label>

              {/* Option 2: Booked */}
              <label
                onClick={() => setSlotStatusChoice('booked')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                  slotStatusChoice === 'booked'
                    ? 'border-rose-500 bg-rose-50/70'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="mt-0.5">
                  <input
                    type="radio"
                    name="slotStatusChoice"
                    checked={slotStatusChoice === 'booked'}
                    onChange={() => setSlotStatusChoice('booked')}
                    className="accent-rose-600 w-4 h-4"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Mark as Booked
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Already reserved via offline walk-in, phone call, tournament, or regular customer.
                  </p>

                  {/* Customer details input when Booked is selected */}
                  {slotStatusChoice === 'booked' && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-rose-200/70">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-rose-900 mb-1">
                          Player / Group Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={slotBookedName}
                          onChange={(e) => setSlotBookedName(e.target.value)}
                          placeholder="e.g. Rahul Team / Walk-in"
                          className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-rose-900 mb-1">
                          Contact Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          value={slotBookedPhone}
                          onChange={(e) => setSlotBookedPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 3: Blocked */}
              <label
                onClick={() => setSlotStatusChoice('blocked')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                  slotStatusChoice === 'blocked'
                    ? 'border-slate-800 bg-slate-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="mt-0.5">
                  <input
                    type="radio"
                    name="slotStatusChoice"
                    checked={slotStatusChoice === 'blocked'}
                    onChange={() => setSlotStatusChoice('blocked')}
                    className="accent-slate-800 w-4 h-4"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                    Mark as Blocked
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Unavailable due to pitch maintenance, turf repair, adverse weather, or private facility use.
                  </p>
                </div>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSlotForManagement(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSlotStatus}
                  className="flex-1 py-2.5 bg-[#2E7D32] hover:bg-[#256629] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {savingSlotStatus ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Slot Status'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PENDING NOTICE MODAL */}
      {slotPendingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2 font-black text-lg">
              ⏱️
            </div>
            <h3 className="text-base font-black text-slate-800">Pending Online Request</h3>
            <p className="text-xs text-slate-500 my-2">
              Slot <span className="font-bold text-slate-800">{slotPendingNotice.time}</span> has a pending booking request from{' '}
              <span className="font-bold text-slate-800">{slotPendingNotice.bookedByUserName || 'an online player'}</span>.
            </p>
            <p className="text-[11px] text-slate-400 mb-4">
              Please switch to the <strong>Booking Approvals Queue</strong> tab to accept or reject this request.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSlotPendingNotice(null)}
                className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSlotPendingNotice(null);
                  setActiveTab('bookings');
                }}
                className="py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl shadow-md"
              >
                Go to Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
