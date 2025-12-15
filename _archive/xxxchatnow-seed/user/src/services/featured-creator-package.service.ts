import { APIRequest } from './api-request';

export class FeaturedCreatorPackageService extends APIRequest {
  searchFeatureCreatorPackage(params?: { [key: string]: any }) {
    return this.get(this.buildUrl('/performer-package/featured-creator/search', params));
  }

  buyFeatureCreatorPackage(id: string, data: any) {
    return this.post(`/payment/purchase-featured-creator/${encodeURIComponent(id)}`, data);
  }

  getApprovedFeatureCreatorListings(params?: { [key: string]: any }) {
    return this.get(this.buildUrl('/featured-creator/booking/approved/search', params));
  }
}

export const featuredCreatorPackageService = new FeaturedCreatorPackageService();
