import { APIRequest, IResponse } from './api-request';

export class StatsService extends APIRequest {
  dashboadStats(): Promise<IResponse<any>> {
    return this.get('/admin/statistics/dashboard');
  }
}

export const statsService = new StatsService();
