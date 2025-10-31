import {
  IPerformerCategoryCreate,
  IPerformerCategorySearch,
  IPerformerCategoryUpdate
} from 'src/interfaces';

import { APIRequest } from './api-request';

export class PerformerCategoryService extends APIRequest {
  create(payload: IPerformerCategoryCreate) {
    return this.post('/admin/performer-categories', payload);
  }

  search(query: IPerformerCategorySearch) {
    return this.get(
      this.buildUrl('/admin/performer-categories/search', query as any)
    );
  }

  findById(id: string) {
    return this.get(`/admin/performer-categories/${encodeURIComponent(id)}/view`);
  }

  update(id: string, payload: IPerformerCategoryUpdate) {
    return this.put(`/admin/performer-categories/${encodeURIComponent(id)}`, payload);
  }

  delete(id: string) {
    return this.del(`/admin/performer-categories/${encodeURIComponent(id)}`);
  }
}

export const performerCategoryService = new PerformerCategoryService();
