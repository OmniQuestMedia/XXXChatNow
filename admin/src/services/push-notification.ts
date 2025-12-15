import { APIRequest } from './api-request';

class PushNotificationService extends APIRequest {
  send(payload: any) {
    return this.post('/notification/send', payload);
  }
}

export const pushNotificationService = new PushNotificationService();
