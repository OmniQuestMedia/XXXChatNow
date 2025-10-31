import { APIRequest } from './api-request';

export class TokenPackageService extends APIRequest {
  search(params?: { [key: string]: any }) {
    return this.get(this.buildUrl('/package/token/search', params));
  }

  buyTokens(id: string) {
    return this.post(`/payment/purchase-tokens/${encodeURIComponent(id)}`);
  }
}

export const tokenPackageService = new TokenPackageService();
