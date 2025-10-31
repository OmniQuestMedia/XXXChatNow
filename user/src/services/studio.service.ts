import { IStudio } from 'src/interfaces';

import { APIRequest, IResponse } from './api-request';

export class StudioService extends APIRequest {
  me(headers?: { [key: string]: string }): Promise<IResponse<IStudio>> {
    return this.get('/studio/me', headers);
  }

  update(payload: any) {
    return this.put('/studio/update', payload);
  }

  updatePaymentInfo(payload): Promise<IResponse<IStudio>> {
    return this.post('/studio/bank-transfer/update', payload);
  }

  updateDirectDepost(payload): Promise<IResponse<IStudio>> {
    return this.post('/studio/direct-deposit/update', payload);
  }

  updatePaxum(payload): Promise<IResponse<IStudio>> {
    return this.post('/studio/paxum/update', payload);
  }

  updateBitpay(payload): Promise<IResponse<IStudio>> {
    return this.post('/studio/bitpay/update', payload);
  }

  getCommission() {
    return this.get('/studio/commission-setting');
  }

  addModel(payload) {
    return this.post('/studio/members', payload);
  }

  getMembers(params?: { [key: string]: string }) {
    return this.get(this.buildUrl('/studio/members', params));
  }

  getMemberCommissions(params?: { [key: string]: any }) {
    return this.get(this.buildUrl('/studio/commission', params));
  }

  updateMemberCommission(id: string, payload: any) {
    return this.put(`/studio/commission/member/${encodeURIComponent(id)}`, payload);
  }

  getPerformerRequest(params?: { [key: string]: string }) {
    return this.get(
      this.buildUrl('/payout-requests/studio/performer-request', params)
    );
  }

  updateStatusPerformerRequest(id: string, payload) {
    return this.put(`/payout-requests/studio/update/${encodeURIComponent(id)}`, { ...payload });
  }

  updateMemberStatus(id: string, status: string) {
    return this.post(`/studio/members/${encodeURIComponent(id)}/${status}`);
  }

  stats() {
    return this.get('/studio/stats');
  }

  getDocumentsUploadUrl() {
    const baseApiEndpoint = this.getBaseApiEndpoint();
    return `${baseApiEndpoint}/studio/documents/upload`;
  }
}

export const studioService = new StudioService();
