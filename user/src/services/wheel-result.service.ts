import { APIRequest } from './api-request';

class WheelResultService extends APIRequest {
  updateStatus(id: string, payload) {
    return this.put(`/wheel-result/status/${id}`, payload);
  }
}

export const wheelResultService = new WheelResultService();
