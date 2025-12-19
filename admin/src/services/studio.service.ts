import { APIRequest } from './api-request';

export class StudioService extends APIRequest {
  create(payload: any) {
    return this.post('/studio/register', payload);
  }

  update(id: string, payload: any) {
    return this.put(`/studio/${encodeURIComponent(id)}/update`, payload);
  }

  search(query?: { [key: string]: any }, headers?: any) {
    return this.get(this.buildUrl('/studio/search', query), headers);
  }

  findById(id: string) {
    return this.get(`/studio/${encodeURIComponent(id)}/view`);
  }

  updateStudioCommission(id: string, payload: any) {
    return this.put(`/studio/commission/${encodeURIComponent(id)}`, payload);
  }

  getUploadDocumentUrl(id?: string) {
    const baseApiEndpoint = this.getBaseApiEndpoint();
    if (id) {
      return `${baseApiEndpoint}/studio/${encodeURIComponent(id)}/documents/upload`;
    }
    return `${baseApiEndpoint}/studio/documents/upload`;
  }
}

export const studioService = new StudioService();
