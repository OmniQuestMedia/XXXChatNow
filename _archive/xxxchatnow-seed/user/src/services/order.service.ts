// import { IGalleryCreate } from 'src/interfaces';
import { APIRequest } from './api-request';

export class OrderService extends APIRequest {
  search(payload) {
    return this.get(this.buildUrl('/orders/search', payload));
  }

  details(id) {
    return this.get(`/orders/details/${encodeURIComponent(id)}`);
  }

  update(id, data) {
    return this.put(`/orders/${encodeURIComponent(id)}/update`, data);
  }

  userSearch(query) {
    return this.get(this.buildUrl('/orders/user/search', query));
  }

  userFindDetails(id) {
    return this.get(`/orders/user/details/${encodeURIComponent(id)}`);
  }
}

export const orderService = new OrderService();
