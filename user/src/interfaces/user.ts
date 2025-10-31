import { ISearch, IStats } from './utils';

export interface IUser {
  _id: string;
  avatar: string;
  username?: string;
  name: string;
  email: string;
  gender?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  roles?: Array<string>;
  role?: string;
  phone?: string;
  city?: string;
  state?: string;
  timezone?: string;
  dateOfBirth?: Date;
  balance: number;
  isPerformer?: boolean;
  stats?: IStats;
  enableGhostMode?: boolean;
  displayName?: string;
  twoFactorAuthenticationEnabled: boolean;
  isPrivacy?: boolean;
  isBlocked?: boolean;
  agePreferences?: Array<string>;
  genderPreferences?: Array<string>;
  ethnicPreferences?: Array<string>;
  tagPreferences?: Array<string>;
  memberRank?: any;
}

export interface IUserSearch extends ISearch {
  role?: string;
}

export interface IRanking {
  points: number;
  badgingIcon: string;
  badgingColor: string;
  badgingName: string;
}
