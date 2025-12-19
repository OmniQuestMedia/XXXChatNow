import { APIRequest } from './api-request';

class FavouriteService extends APIRequest {
  like(id: string) {
    return this.post(`/favourite/${encodeURIComponent(id)}/like`);
  }

  unlike(id: string) {
    return this.post(`/favourite/${encodeURIComponent(id)}/unlike`);
  }

  favorite(id: string, isFavorited: boolean) {
    return this.post(`/favourite/${encodeURIComponent(id)}/${isFavorited ? 'unlike' : 'like'}`);
  }

  search(query: { [key: string]: string }) {
    return this.get(this.buildUrl('/favourite', query));
  }
}

export const favouriteService = new FavouriteService();
