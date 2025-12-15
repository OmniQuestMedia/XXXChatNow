import { APIRequest } from './api-request';

export class PurchaseItemService extends APIRequest {
  search(query) {
    return this.get(this.buildUrl('/purchased-items/user/search', query));
  }

  purchaseItem(id: string, type: string, data?: any) {
    return this.post(`/purchase-items/${type}/${encodeURIComponent(id)}`, data);
  }

  purchaseProduct(id: string) {
    return this.post(`/purchase-items/product/${encodeURIComponent(id)}`);
  }

  purchaseVideo(id: string) {
    return this.post(`/purchase-items/video/${encodeURIComponent(id)}`);
  }
}

export const purchaseItemService = new PurchaseItemService();
