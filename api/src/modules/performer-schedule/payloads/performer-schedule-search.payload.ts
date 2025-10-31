import {
  IsDateString, IsIn, IsOptional, IsString
} from 'class-validator';
import { SearchRequest } from 'src/kernel';
import { STATUS } from 'src/kernel/constants';

export class PerformerScheduleSearchPayload extends SearchRequest {
    @IsString()
    @IsOptional()
    q: string;

    @IsString()
    @IsOptional()
    performerId: string;

    @IsOptional()
    @IsDateString()
    startAt: Date;

    @IsOptional()
    @IsDateString()
    endAt: Date;

    @IsString()
    @IsOptional()
    @IsIn([STATUS.ACTIVE, STATUS.INACTIVE])
    status: string;
}
