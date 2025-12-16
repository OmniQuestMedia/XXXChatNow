import { APIRequest } from './api-request';

export class EventsListingService extends APIRequest {
  performerGetSchedules(query?: Record<string, any>) {
    return this.get(this.buildUrl('/performer-schedule', query));
  }

  userGetSchedules(query?: Record<string, any>) {
    return this.get(this.buildUrl('/performer-schedule/search', query));
  }

  findOne(id: string, headers?: { [key: string]: string }) {
    return this.get(`/performer-schedule/${id}/view`, headers);
  }

  createSchedule(data) {
    return this.post('/performer-schedule', data);
  }

  updateSchedule(id:string, payload: any) {
    return this.put(`/performer-schedule/${id}`, payload);
  }

  deleteSchedule(id: string) {
    return this.del(`/performer-schedule/${id}`);
  }
}

export const eventsListingService = new EventsListingService();
