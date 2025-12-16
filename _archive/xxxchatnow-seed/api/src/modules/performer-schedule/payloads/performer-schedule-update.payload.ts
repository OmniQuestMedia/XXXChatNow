import {
  IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString
} from 'class-validator';
import { STATUS } from 'src/kernel/constants';

export class PerformerScheduleUpdatePayload {
    @IsString()
    @IsOptional()
    title: string;

    @IsNumber()
    @IsOptional()
    price: number;

    @IsOptional()
    @IsDateString()
    startAt: Date;

    @IsOptional()
    @IsDateString()
    endAt: Date;

    @IsString()
    @IsOptional()
    description: string;

    @IsString()
    @IsOptional()
    @IsIn([STATUS.ACTIVE, STATUS.INACTIVE])
    status: string;

    @IsBoolean()
    @IsOptional()
    isPrivate: boolean;
}
