import { APIRequest } from './api-request';

class EarningService extends APIRequest {
  search(params?: { [key: string]: string }, role = 'performer') {
    return this.get(this.buildUrl(`/earning/${role}/search`, params));
  }

  stats(params?: { [key: string]: string }, role = 'performer') {
    return this.get(this.buildUrl(`/earning/${role}/stats`, params));
  }

  exportCsv(query?: { [key: string]: any }, role = 'performer') {
    const baseApiEndpoint = this.getBaseApiEndpoint();
    return (
      baseApiEndpoint
      + this.buildUrl(`/earning/${role}/export/csv`, {
        ...query
      })
    );
  }

  referralStats() {
    return this.get('/referral-earnings/stats');
  }

  referralSearch(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/referral-earnings/search', query));
  }
}

export const earningService = new EarningService();
