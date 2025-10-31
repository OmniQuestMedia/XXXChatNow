import { APIRequest } from "./api-request";

export class CrowdfundingService extends APIRequest {
  create(payload: any) {
    return this.post('/crowdfunding', payload)
  }

  getCrowdfundings(payload: any) {
    return this.get(this.buildUrl('/crowdfunding', payload))
  }

  getById(id: string, headers?: { [key: string]: string }) {
    return this.get(this.buildUrl(`/crowdfunding/${id}`))
  }

  updateById(id: string, payload) {
    return this.put(`/crowdfunding/${id}`, payload);
  }

  deleteCrowdfunding(id: string) {
    return this.del(`/crowdfunding/${id}`);
  }

  userSearch(payload: any) {
    return this.get(this.buildUrl('/crowdfunding/user/search', payload))
  }
}

export const crowdfundingService = new CrowdfundingService();