import { APIRequest } from './api-request';

export class LeaderBoardService extends APIRequest {
  create(payload: any) {
    return this.post('/admin/leader-board', payload);
  }

  search(query?: { [key: string]: string }) {
    return this.get(this.buildUrl('/admin/leader-board/search', query));
  }

  findOne(id: string) {
    return this.get(`/admin/leader-board/search/view/${id}`);
  }

  updateOne(id: string, data: any) {
    return this.put(`/admin/leader-board/update/${id}`, data);
  }

  deleteOne(id: string) {
    return this.del(`/admin/leader-board/delete/${id}`);
  }
}

export const leaderBoardService = new LeaderBoardService();
