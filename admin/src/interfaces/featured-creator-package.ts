import { ISearch } from './utils';

export interface IFeaturedCreatorPackage {
  _id: string;
  name: string;
  price: number;
  description: string;
  status: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface IFeaturedCreatorPackageCreate {
  name: string;
  price: number;
  description: string;
  status: string;
}

export interface IFeaturedCreatorPackageUpdate {
  _id: string;
  name: string;
  price: number;
  description: string;
  status: string;
}

export interface IFeaturedCreatorPackageSearch extends ISearch {
  status?: string;
  name?: string;
}

export interface IFeaturedCreatorBooking {
  _id: string;
  name: string;
  price: number;
  description: string;
  status: string;
  updatedAt: Date;
  createdAt: Date;
}