import { IUser } from 'src/interfaces';

import { APIRequest, IResponse } from './api-request';

export class UserService extends APIRequest {
  me(headers?: { [key: string]: string }): Promise<IResponse<IUser>> {
    return this.get('/users/me', headers);
  }

  updateMe(payload: any) {
    return this.put('/admin/users', payload);
  }

  create(payload: any) {
    return this.post('/admin/users', payload);
  }

  update(id: string, payload: any) {
    return this.put(`/admin/users/${encodeURIComponent(id)}`, payload);
  }

  getAvatarUploadUrl(userId?: string) {
    const baseApiEndpoint = this.getBaseApiEndpoint();
    if (userId) {
      return `${baseApiEndpoint}/admin/users/${userId}/avatar/upload`;
    }
    return `${baseApiEndpoint}/users/avatar/upload`;
  }

  uploadAvatarUser(file: File, userId?: string) {
    return this.upload(`/admin/users/${userId}/avatar/upload`, [
      { file, fieldname: 'avatar' }
    ]);
  }

  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/admin/users/search', query));
  }

  findById(id: string) {
    return this.get(`/admin/users/${encodeURIComponent(id)}/view`);
  }

  exportCsv(query?: { [key: string]: any }) {
    const baseApiEndpoint = this.getBaseApiEndpoint();
    return (
      baseApiEndpoint
      + this.buildUrl('/admin/users/export/csv', {
        ...query
      })
    );
  }

  turnOnOff2FA(payload) {
    return this.post('/admin/users/2fa/turn-on-off', payload);
  }
}

export const userService = new UserService();
