import { APIRequest } from './api-request';

export class MenuService extends APIRequest {
  create(payload: any) {
    return this.post('/admin/menus', payload);
  }

  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/admin/menus/search', query));
  }

  findById(id: string) {
    return this.get(`/admin/menus/${encodeURIComponent(id)}/view`);
  }

  update(id: string, payload: any) {
    return this.put(`/admin/menus/${encodeURIComponent(id)}`, payload);
  }

  delete(id: string) {
    return this.del(`/admin/menus/${encodeURIComponent(id)}`);
  }
}

export const menuService = new MenuService();
