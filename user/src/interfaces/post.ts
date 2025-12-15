import { ISearch } from './utils';

export interface IPost {
  title: string;
  type: string;
  slug: string;
  content: string;
  shortDescription: string;
  categoryIds: string[];
  status: string;
  image: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeyword?: string;
  updatedBy: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostSearch extends ISearch {
  status?: string;
}
