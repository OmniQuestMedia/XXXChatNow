import { APIRequest } from './api-request';

class NotificationService extends APIRequest {
  notify(payload?: Record<string, any>) {
    return this.post('/notification/me', payload);
  }

  unnotify(payload?: Record<string, any>) {
    return this.del('/notification/remove/', payload);
  }

  public create(payload: any) {
    return this.post('/notification/token', payload);
  }

  public search(req: any) {
    return this.get(this.buildUrl('/notification/token/search', req));
  }

  public delete(id: string) {
    return this.del(`/notification/token/${id}`);
  }
}

export const notificationService = new NotificationService();
