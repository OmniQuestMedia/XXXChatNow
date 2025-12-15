import { APIRequest } from './api-request';

class EarningService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/admin/earning/search', query));
  }

  stats(params?: { [key: string]: any }) {
    return this.get(this.buildUrl('/admin/earning/stats', params));
  }

  exportCsv(query?: { [key: string]: any }) {
    const baseApiEndpoint = this.getBaseApiEndpoint();
    return (
      baseApiEndpoint
      + this.buildUrl('/admin/earning/export/csv', {
        ...query
      })
    );
  }
}
export const earningService = new EarningService();
