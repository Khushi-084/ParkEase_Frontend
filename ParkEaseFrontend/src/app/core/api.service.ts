import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AuthResponse,
  BookingResponse,
  BulkCreateSlotRequest,
  ChangePasswordRequest,
  CreateBookingRequest,
  CreateBookingResponse,
  CreateLotRequest,
  CreateTicketRequest,
  ExitTicketRequest,
  ExitTicketResponse,
  LoginRequest,
  LotResponse,
  PagedResponse,
  PaymentResponse,
  RegisterRequest,
  SlotAvailabilityResponse,
  SlotResponse,
  SlotStatusUpdateRequest,
  TicketResponse,
  UpdateLotRequest,
  UpdateProfileRequest,
  UserProfileResponse,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>('/auth/api/v1/auth/login', payload);
  }

  register(payload: RegisterRequest) {
    return this.http.post<AuthResponse>('/auth/api/v1/auth/register', payload);
  }

  getProfile() {
    return this.http.get<UserProfileResponse>('/auth/api/v1/auth/profile');
  }

  updateProfile(payload: UpdateProfileRequest) {
    return this.http.put<UserProfileResponse>('/auth/api/v1/auth/profile', payload);
  }

  changePassword(payload: ChangePasswordRequest) {
    return this.http.put<{ message: string }>('/auth/api/v1/auth/password', payload);
  }

  deactivateAccount() {
    return this.http.delete<{ message: string }>('/auth/api/v1/auth/deactivate');
  }

  getUsers(role?: string, active?: boolean) {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    if (active !== undefined) params = params.set('active', String(active));
    return this.http.get<UserProfileResponse[]>('/auth/api/v1/admin/users', { params });
  }

  getPendingLotManagers() {
    return this.http.get<UserProfileResponse[]>('/auth/api/v1/admin/users/pending-lotmanagers');
  }

  approveLotManager(userId: string) {
    return this.http.patch<UserProfileResponse>(`/auth/api/v1/admin/users/${userId}/approve`, {});
  }

  rejectLotManager(userId: string) {
    return this.http.patch<UserProfileResponse>(`/auth/api/v1/admin/users/${userId}/reject`, {});
  }

  changeUserRole(userId: string, role: string) {
    return this.http.patch<UserProfileResponse>(`/auth/api/v1/admin/users/${userId}/role`, { role });
  }

  activateUser(userId: string) {
    return this.http.patch<{ message: string }>(`/auth/api/v1/admin/users/${userId}/activate`, {});
  }

  deactivateUser(userId: string) {
    return this.http.patch<{ message: string }>(`/auth/api/v1/admin/users/${userId}/deactivate`, {});
  }

  deleteUser(userId: string) {
    return this.http.delete<{ message: string }>(`/auth/api/v1/admin/users/${userId}`);
  }

  getLots(page = 1, pageSize = 50, city?: string, status?: string) {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    if (city) params = params.set('city', city);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResponse<LotResponse>>('/parking/api/v1/lots', { params });
  }

  getLotById(lotId: string) {
    return this.http.get<LotResponse>(`/parking/api/v1/lots/${lotId}`);
  }

  createLot(payload: CreateLotRequest) {
    return this.http.post<LotResponse>('/parking/api/v1/lots', payload);
  }

  updateLot(lotId: string, payload: UpdateLotRequest) {
    return this.http.put<LotResponse>(`/parking/api/v1/lots/${lotId}`, payload);
  }

  updateLotStatus(lotId: string, status: string) {
    return this.http.patch<LotResponse>(`/parking/api/v1/lots/${lotId}/status`, { status });
  }

  getSlotsByLot(lotId: string) {
    return this.http.get<SlotResponse[]>(`/slot/api/v1/slots/lot/${lotId}`);
  }

  getAvailability(lotId: string, type?: string) {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<SlotAvailabilityResponse>(`/slot/api/v1/slots/lot/${lotId}/availability`, { params });
  }

  bulkCreateSlots(payload: BulkCreateSlotRequest) {
    return this.http.post<SlotResponse[]>('/slot/api/v1/slots/bulk', payload);
  }

  updateSlotStatus(slotId: string, payload: SlotStatusUpdateRequest) {
    return this.http.patch<SlotResponse>(`/slot/api/v1/slots/${slotId}/status`, payload);
  }

  createBooking(payload: CreateBookingRequest) {
    return this.http.post<CreateBookingResponse>('/booking/api/v1/bookings', payload);
  }

  getUserBookings(userId: string) {
    return this.http.get<BookingResponse[]>(`/booking/api/v1/bookings/user/${userId}`);
  }

  createTicket(payload: CreateTicketRequest) {
    return this.http.post<TicketResponse>('/ticket/api/v1/ticket', payload);
  }

  getTicket(ticketId: string) {
    return this.http.get<TicketResponse>(`/ticket/api/v1/ticket/${ticketId}`);
  }

  exitTicket(ticketId: string, payload: ExitTicketRequest) {
    return this.http.put<ExitTicketResponse>(`/ticket/api/v1/ticket/exit/${ticketId}`, payload);
  }

  getPaymentByBooking(bookingId: string) {
    return this.http.get<PaymentResponse>(`/payment/api/v1/payment/booking/${bookingId}`);
  }

  getPaymentByTicket(ticketId: string) {
    return this.http.get<PaymentResponse>(`/payment/api/v1/payment/ticket/${ticketId}`);
  }

  updatePaymentStatus(paymentId: string, status: string, transactionId?: string) {
    return this.http.patch<PaymentResponse>(`/payment/api/v1/payment/${paymentId}/status`, { status, transactionId });
  }

  verifyPayment(payload: { razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string }) {
    return this.http.post<{ message: string }>('/payment/api/v1/payment/order/verify', payload);
  }
}
