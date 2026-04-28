import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';
import { AdminServicePageComponent } from './pages/admin-service-page.component';
import { AuthServicePageComponent } from './pages/auth-service-page.component';
import { BookingServicePageComponent } from './pages/booking-service-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { ParkingServicePageComponent } from './pages/parking-service-page.component';
import { PaymentServicePageComponent } from './pages/payment-service-page.component';
import { ProfilePageComponent } from './pages/profile-page.component';
import { RegisterPageComponent } from './pages/register-page.component';
import { SlotServicePageComponent } from './pages/slot-service-page.component';
import { TicketServicePageComponent } from './pages/ticket-service-page.component';
import { NotificationPageComponent } from './pages/notification-page.component';
import { WelcomePageComponent } from './pages/welcome-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'welcome' },
  { path: 'welcome', component: WelcomePageComponent },
  { path: 'auth/login', component: LoginPageComponent, canActivate: [guestGuard] },
  { path: 'auth/register', component: RegisterPageComponent, canActivate: [guestGuard] },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationPageComponent, canActivate: [authGuard] },
  { path: 'services/auth', component: AuthServicePageComponent, canActivate: [authGuard] },
  { path: 'services/parking', component: ParkingServicePageComponent, canActivate: [authGuard] },
  { path: 'services/slot', component: SlotServicePageComponent, canActivate: [authGuard] },
  { path: 'services/booking', component: BookingServicePageComponent, canActivate: [authGuard] },
  { path: 'services/ticket', component: TicketServicePageComponent, canActivate: [authGuard] },
  { path: 'services/payment', component: PaymentServicePageComponent, canActivate: [authGuard] },
  { path: 'services/admin', component: AdminServicePageComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfilePageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'welcome' },
];
