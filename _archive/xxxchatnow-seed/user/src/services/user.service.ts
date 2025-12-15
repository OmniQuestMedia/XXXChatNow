import { IUser } from 'src/interfaces';

import { APIRequest, IResponse } from './api-request';

export class UserService extends APIRequest {
  me(headers?: { [key: string]: string }): Promise<IResponse<IUser>> {
    return this.get('/users/me', headers);
  }

  updateMe(payload: any) {
    return this.put('/users', payload);
  }

  getAvatarUploadUrl(userId?: string) {
    const baseApiEndpoint = this.getBaseApiEndpoint();
    if (userId) {
      return `${baseApiEndpoint}/users/${userId}/avatar/upload`;
    }
    return `${baseApiEndpoint}/users/avatar/upload`;
  }

  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/users/search', query));
  }

  findById(id: string) {
    return this.get(`/users/view/${encodeURIComponent(id)}`);
  }

  suspendAccount(password: string) {
    return this.post('/users/suspend-account', { password });
  }
}

export const userService = new UserService();
