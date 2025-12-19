import { APIRequest } from './api-request';

export class PayoutRequestService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/payout-requests/search', query)
    );
  }

  update(id: string, payload: any) {
    return this.put(`/admin/payout-requests/${encodeURIComponent(id)}/status`, payload);
  }

  findById(id: string) {
    return this.get(`/admin/payout-requests/${encodeURIComponent(id)}`);
  }
}

export const payoutRequestService = new PayoutRequestService();
