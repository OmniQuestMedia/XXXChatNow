import { APIRequest } from './api-request';

export class VideoService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/admin/performer-assets/videos/search', query)
    );
  }

  findById(id: string) {
    return this.get(`/admin/performer-assets/videos/${encodeURIComponent(id)}/view`);
  }

  update(id: string, payload: any) {
    return this.put(`/admin/performer-assets/videos/${encodeURIComponent(id)}`, payload);
  }

  uploadVideo(
    files: [{ fieldname: string; file: File }],
    payload: any,
    onProgress?: Function
  ) {
    return this.upload('/admin/performer-assets/videos/upload', files, {
      onProgress,
      customData: payload
    });
  }

  delete(id: string) {
    return this.del(`/admin/performer-assets/videos/${encodeURIComponent(id)}`);
  }
}

export const videoService = new VideoService();
