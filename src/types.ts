export type UserRole = 'user' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isBanned?: boolean;
  businessName?: string;
  paymentQrUrl?: string;
  isSuspended?: boolean;
  isVerified?: boolean;
  createdAt?: string;
}

export interface TurfOwner extends User {
  businessName?: string;
  paymentQrUrl?: string;
  isSuspended?: boolean;
  isVerified?: boolean;
}

export type SportType =
  | 'Football'
  | 'Cricket'
  | 'Badminton'
  | 'Tennis'
  | 'Basketball'
  | 'Volleyball'
  | 'Pickleball'
  | 'Table Tennis'
  | 'Squash'
  | 'Hockey'
  | 'Futsal';

export type TurfFacility =
  | 'AC'
  | 'Floodlights'
  | 'Parking'
  | 'Washrooms'
  | 'Cafeteria'
  | 'Changing Rooms';

export interface TurfImage {
  id: string;
  url: string;
  caption?: string;
}

export interface Turf {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerPaymentQrUrl?: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  distanceKm: number;
  sports: SportType[];
  isIndoor: boolean;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  images: string[]; // min 3 required
  facilities: TurfFacility[];
  isUnposted: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  isTopRated?: boolean;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export type SlotStatus = 'available' | 'pending' | 'booked' | 'blocked';

export interface Slot {
  id: string;
  turfId: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "06:00 - 07:00"
  price: number;
  status: SlotStatus;
  bookedByUserId?: string;
  bookedByUserName?: string;
  bookedByUserEmail?: string;
  bookedByUserPhone?: string;
  bookingId?: string;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  turfId: string;
  turfName: string;
  turfImage: string;
  slotId: string;
  date: string;
  time: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  ownerId: string;
  sport: SportType;
  totalAmount: number;
  status: BookingStatus;
  ownerPhone?: string; // Revealed ONLY when status === 'approved'
  ownerPaymentQrUrl?: string; // Revealed ONLY when status === 'approved'
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  turfId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  photoUrl?: string;
  ownerReply?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled';
  link?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalTurfs: number;
  totalBookings: number;
  totalRevenue: number;
  pendingReports: number;
}

export interface FilterState {
  searchQuery: string;
  city: string;
  selectedSport: SportType | 'All';
  maxPrice: number;
  minRating: number;
  isIndoorFilter: 'all' | 'indoor' | 'outdoor';
  facilities: TurfFacility[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  turfId: string;
  turfName: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  text: string;
  createdAt: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  turfId: string;
  turfName: string;
  turfImage?: string;
  playerId: string;
  playerName: string;
  playerEmail?: string;
  ownerId: string;
  ownerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCountPlayer: number;
  unreadCountOwner: number;
  updatedAt: string;
}
