export interface ICrowdfunding {
  _id: string;
  title: string;
  descriptions: string;
  token: number;
  remainingToken: number;
  performerId: string;
  contributes: any;
  createdAt: Date;
  updatedAt: Date;
}
