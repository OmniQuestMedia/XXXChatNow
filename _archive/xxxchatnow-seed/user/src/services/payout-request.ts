import { IResponse } from 'src/interfaces';

import { APIRequest } from './api-request';

class PayoutRequestService extends APIRequest {
  calculate(params: { [key: string]: string }, role: string) {
    return this.get(
      this.buildUrl(`/earning/${role || 'performer'}/payout`, params)
    );
  }

  search(query: { [key: string]: string }) {
    return this.get(this.buildUrl('/payout-requests/performer/search', query));
  }

  studioSearch(query: { [key: string]: string }) {
    return this.get(this.buildUrl('/payout-requests/studio/search', query));
  }

  create(body: any, role = 'performer') {
    return this.post(`/payout-requests/${role}`, body);
  }

  update(id: string, body: any, role = 'performer') {
    return this.put(`/payout-requests/${role}/${encodeURIComponent(id)}`, body);
  }

  detail(
    id: string,
    headers: {
      [key: string]: string;
    },
    role = 'performer'
  ): Promise<IResponse<PayoutRequestService>> {
    return this.get(`/payout-requests/${role}/${encodeURIComponent(id)}/view`, headers);
  }

  stats() {
    return this.post('/payout-requests/performer/stats');
  }

  studioStats() {
    return this.post('/payout-requests/studio/stats');
  }

  getPendingRequests() {
    return this.get('/payout-requests/performer/pending-requests');
  }
}

export const payoutRequestService = new PayoutRequestService();
