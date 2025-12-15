import { APIRequest } from './api-request';

export class StreamGoalsService extends APIRequest {
  getStreamGoals(streamId: string) {
    return this.get(this.buildUrl('/streaming/goals/search', { id: streamId }));
  }

  createStreamGoals(streamId, data) {
    return this.post(`/streaming/goals/${streamId}`, data);
  }

  resetRemainTokens(streamId: string) {
    return this.post(`/streaming/goals/reset/${streamId}`);
  }
}

export const streamGoalsService = new StreamGoalsService();
