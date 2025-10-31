import { IPerformer } from './performer';
import { IUser } from './user';

export class ILeaderBoard {
  _id: string;

  title: string;

  duration: string;

  type: string;

  status: string;

  data: {
    user: IUser | IPerformer,
    total: number;
  }[];
}
