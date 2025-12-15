import { APIRequest } from './api-request';

export class PerformerService extends APIRequest {
  create(payload: any) {
    return this.post('/admin/performers', payload);
  }

  update(id: string, payload: any) {
    return this.put(`/admin/performers/${encodeURIComponent(id)}`, payload);
  }

  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/admin/performers/search', query));
  }

  searchOnline(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/admin/performers/online', query));
  }

  findById(id: string) {
    return this.get(`/admin/performers/${encodeURIComponent(id)}/view`);
  }

  getUploadDocumentUrl() {
    const baseApiEndpoint = this.getBaseApiEndpoint();
    return `${baseApiEndpoint}/admin/performers/documents/upload`;
  }

  getAvatarUploadUrl() {
    const baseApiEndpoint = this.getBaseApiEndpoint();
    return `${baseApiEndpoint}/admin/performers/avatar/upload`;
  }

  updateCommissionSetting(payload: any) {
    return this.put('/admin/performer-commission/update', payload);
  }

  exportCsv(query?: { [key: string]: any }) {
    const baseApiEndpoint = this.getBaseApiEndpoint();
    return (
      baseApiEndpoint
      + this.buildUrl('/admin/performers/export/csv', {
        ...query
      })
    );
  }
}

export const performerService = new PerformerService();
