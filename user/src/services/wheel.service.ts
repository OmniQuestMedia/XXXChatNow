import { APIRequest } from './api-request';

class WheelService extends APIRequest {
  create(payload) {
    return this.post('/wheels', payload);
  }

  search(param?: any) {
    return this.get(this.buildUrl('/wheels/search', param));
  }

  myList(param?: any) {
    return this.get(this.buildUrl('/wheels', param));
  }

  update(id: string, payload) {
    return this.put(`/wheels/${id}`, payload);
  }

  findById(id: string, headers?: any) {
    return this.get(`/wheels/${encodeURI(id)}/view`, headers);
  }

  delete(id: string) {
    return this.del(`/wheels/${id}`);
  }
}

export const wheelService = new WheelService();
