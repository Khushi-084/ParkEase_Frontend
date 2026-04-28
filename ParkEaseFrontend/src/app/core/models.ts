export type UserRole = 'Admin' | 'Driver' | 'LotManager';
export type PaymentMode = 'Card' | 'UPI' | 'Wallet' | 'Cash';
export type SlotType = 'Car' | 'Bike' | 'Truck' | 'EV';

export interface AuthResponse {
  token: string;
  role: UserRole;
  userId: string;
  fullName: string;
  email: string;
  isApproved: boolean | null;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: Exclude<UserRole, 'Admin'>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserProfileResponse {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  isApproved: boolean | null;
  profilePicUrl: string | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone: string;
  profilePicUrl: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LotResponse {
  lotId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  availableSpots: number;
  pricePerHour: number;
  status: string;
  managerId: string;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLotRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  pricePerHour: number;
  managerId: string;
  imageUrl?: string | null;
  description?: string | null;
}

export interface UpdateLotRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  pricePerHour: number;
  imageUrl?: string | null;
  description?: string | null;
}

export interface SlotResponse {
  slotId: string;
  lotId: string;
  slotNumber: string;
  type: SlotType;
  status: string;
  pricePerHour: number;
  createdAt: string;
  updatedAt: string;
}

export interface SlotAvailabilityResponse {
  lotId: string;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  availableSlotDetails: SlotResponse[];
}

export interface BulkCreateSlotRequest {
  lotId: string;
  type: SlotType;
  count: number;
  prefix: string;
  pricePerHour: number;
}

export interface SlotStatusUpdateRequest {
  status: 'Available' | 'Occupied' | 'Reserved' | 'UnderMaintenance';
}

export interface CreateBookingRequest {
  slotId: string;
  userId: string;
  amount: number;
}

export interface CreateBookingResponse {
  bookingId: string;
  slotId: string;
  userId: string;
  amount: number;
  status: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  currency: string;
  correlationId: string;
  createdAt: string;
}

export interface BookingResponse {
  id: string;
  slotId: string;
  userId: string;
  amount: number;
  status: string;
  razorpayOrderId: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  vehicleNumber: string;
  slotType?: SlotType | null;
}

export interface TicketResponse {
  id: string;
  displayId: string;
  vehicleNumber: string;
  slotId: string;
  slotNumber: string;
  entryTime: string;
  exitTime: string | null;
  status: string;
  amount: number;
}

export interface ExitTicketRequest {
  paymentMode: PaymentMode;
}

export interface ExitTicketResponse {
  id: string;
  displayId: string;
  vehicleNumber: string;
  slotId: string;
  slotNumber: string;
  entryTime: string;
  exitTime: string;
  durationHours: number;
  status: string;
  amount: number;
  paymentId: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
}

export interface PaymentResponse {
  paymentId: string;
  bookingId: string | null;
  ticketId: string | null;
  amount: number;
  mode: string;
  transactionId: string | null;
  status: string;
  createdAt: string;
  refundedAt: string | null;
  razorpayOrderId: string | null;
  razorpayKeyId: string | null;
}
