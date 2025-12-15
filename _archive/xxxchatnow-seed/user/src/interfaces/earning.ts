import { IPerformer } from './performer';
import { ITransaction } from './transaction';
import { IUser } from './user';

export interface IEarning {
  _id: string;
  createAt: Date;
  updateAt: Date;
  userId: string;
  userInfo: IUser;
  transactionTokenId: string;
  transactionInfo: ITransaction;
  performerId: string;
  performerInfo: IPerformer;
  sourceType: string;
  grossPrice: number;
  netPrice: number;
  isPaid: boolean;
  commission: number;
  paidAt: Date;
  transactionStatus: string;
  conversionRate?: number;
  payoutStatus: string;
}
