import { pick } from "lodash";

export class LeaderBoardDto {
  _id?: any;

  title?: string;

  duration?: string;

  type?: string;

  status?: string;

  createdAt?: Date;

  updatedAt?: Date;

  constructor(data?: Partial<LeaderBoardDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'title',
        'duration',
        'type',
        'status'
      ])
    )
  }
}