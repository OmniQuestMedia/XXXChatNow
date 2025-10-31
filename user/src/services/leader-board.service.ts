import { APIRequest } from './api-request';

class LeaderBoardService extends APIRequest {
  search() {
    return this.get(this.buildUrl('/leader-board/search'));
  }
}

export const leaderBoardService = new LeaderBoardService();
