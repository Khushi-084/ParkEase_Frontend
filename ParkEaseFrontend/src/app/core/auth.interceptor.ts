import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();

  // THIS IS YOUR GATEWAY URL
  const baseUrl = 'https://parkease-api-gateway-47ib.onrender.com';

  // Clone the request and add the Base URL + Authorization header
  const apiReq = req.clone({
    url: `${baseUrl}${req.url}`,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
  });

  return next(apiReq);
};
