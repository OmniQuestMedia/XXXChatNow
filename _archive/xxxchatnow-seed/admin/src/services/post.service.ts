import { IPostCreate, IPostSearch, IPostUpdate } from 'src/interfaces';

import { APIRequest } from './api-request';

export class PostService extends APIRequest {
  create(payload: IPostCreate) {
    return this.post('/admin/posts', payload);
  }

  search(query: IPostSearch) {
    return this.get(this.buildUrl('/admin/posts/search', query as any));
  }

  findById(id: string) {
    return this.get(`/admin/posts/${encodeURIComponent(id)}/view`);
  }

  update(id: string, payload: IPostUpdate) {
    return this.put(`/admin/posts/${encodeURIComponent(id)}`, payload);
  }

  delete(id: string) {
    return this.del(`/admin/posts/${encodeURIComponent(id)}`);
  }
}

export const postService = new PostService();
