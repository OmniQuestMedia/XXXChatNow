import { APIRequest } from './api-request';

export class CamAggregatorService extends APIRequest {
  online(query: any) {
    return this.get(this.buildUrl('/cam-aggregator/online', query as any));
  }

  categories(query: any) {
    return this.get(this.buildUrl('/cam-aggregator/categories', query as any));
  }

  profile(username: string, service?: string) {
    let s = 's';
    switch (service) {
      case 'x': case 'xlovecam':
        s = 'x';
        break;
      case 'b': case 'bongacams':
        s = 'b';
        break;
      case 's': case 'stripcash':
        s = 's';
        break;
      case 'c': case 'chaturbate':
        s = 'c';
        break;
      default: break;
    }
    return this.get(service ? `/cam-aggregator/profile/${s}/${username}` : `/cam-aggregator/profile/${username}`);
  }

  related(username) {
    return this.get(`/cam-aggregator/${username}/related`);
  }

  findOne(alias) {
    return this.get(`/cam-aggregator/user/categories/${alias}`);
  }
}

export const camAggregatorService = new CamAggregatorService();
