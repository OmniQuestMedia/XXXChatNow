import cookie from 'js-cookie';
import { ILogin } from 'src/interfaces';

import { APIRequest, TOKEN } from './api-request';

export class AuthService extends APIRequest {
  public async login(data: ILogin) {
    return this.post('/auth/admin/login', data);
  }

  setToken(token: string): void {
    process.browser && localStorage.setItem(TOKEN, token);
    // https://github.com/js-cookie/js-cookie
    // since Safari does not support, need a better solution
    cookie.set(TOKEN, token);
    this.setAuthHeaderToken(token);
  }

  getToken(): string {
    const token = cookie.get(TOKEN);
    if (token) {
      return token;
    }
    return !token && process.browser ? localStorage.getItem(TOKEN) : null;
  }

  removeToken(): void {
    cookie.remove(TOKEN);
    process.browser && localStorage.removeItem(TOKEN);
  }

  updatePassword(password: string, userId?: string, source?: string) {
    const url = userId ? '/auth/users/password' : '/auth/users/me/password';
    return this.put(url, { userId, password, source });
  }

  updateAdminPassword(data) {
    return this.put('/auth/users/me/password', data);
  }

  forgotPassword(email: string, type: string) {
    const data = {
      email,
      type
    };
    return this.post('/auth/users/forgot', data);
  }

  getQrCode2FA() {
    return this.post('/auth/2fa/generateQR');
  }

  verify2FA(data) {
    return this.post('/auth/2fa/authenticate', data);
  }
}

export const authService = new AuthService();
