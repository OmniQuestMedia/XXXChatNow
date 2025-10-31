import { APIRequest } from './api-request';

export class AggregatorService extends APIRequest {
  search(query?: any) {
    return this.get(this.buildUrl('/cam-aggregator/admin/categories', query));
  }

  update(id: string, payload: any) {
    return this.put(`/cam-aggregator/admin/categories/${id}`, payload);
  }

  findById(id: string) {
    return this.get(`/cam-aggregator/admin/categories/${id}`);
  }
}
export const aggregatorService = new AggregatorService();
