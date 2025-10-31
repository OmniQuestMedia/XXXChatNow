import { APIRequest } from './api-request';
import { IFeaturedCreatorPackageCreate, IFeaturedCreatorPackageUpdate } from '../interfaces'

class FeaturedCreatorService extends APIRequest {

  createFeaturedPackage(payload: IFeaturedCreatorPackageCreate) {
    return this.post('/admin/package/featured-creator', payload);
  }

  listFeaturedPackage(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/admin/package/featured-creator', query));
  }

  findFeaturedPackageById(id: string) {
    return this.get(`/admin/package/featured-creator/view/${id}`);
  }

  updateFeaturedPackage(id: string, payload: IFeaturedCreatorPackageUpdate) {
    return this.put(`/admin/package/featured-creator/update/${id}`, payload);
  }

  deleteFeaturedPackage(id: string) {
    return this.del(`/admin/package/featured-creator/delete/${id}`);
  }

  listBooking(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/admin/package/featured-creator/booking', query));
  }

  bookingDetails(id: string) {
    return this.get(`/admin/package/featured-creator/booking/view/${id}`);
  }

  updateBooking(id: string, payload: IFeaturedCreatorPackageUpdate) {
    return this.put(`/admin/package/featured-creator/booking/update/${id}`, payload);
  }

  bookingStatusList(payload: any) {
    return this.get(this.buildUrl('/featured-creator/booking-status', payload));
  }

  cancelApprovedFeaturedCreator(id) {
    return this.put(`/featured-creator/booking-status/update/${id}`);
  }
}

export const featuredCreatorService = new FeaturedCreatorService();