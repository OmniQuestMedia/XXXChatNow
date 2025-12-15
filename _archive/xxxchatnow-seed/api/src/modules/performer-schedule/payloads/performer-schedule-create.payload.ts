import {
  IsBoolean, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf
} from 'class-validator';
import { STATUS } from 'src/kernel/constants';

export class PerformerScheduleCreatePayload {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description: string;

    @IsBoolean()
    @IsOptional()
    isPrivate: boolean;

    @ValidateIf((o) => o.isPrivate === true)

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsNotEmpty()
    @IsDateString()
    startAt: Date;

    @IsNotEmpty()
    @IsDateString()
    endAt: Date;

    @IsString()
    @IsOptional()
    @IsIn([STATUS.ACTIVE, STATUS.INACTIVE])
    status: string;
}
