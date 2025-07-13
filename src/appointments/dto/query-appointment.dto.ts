import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAppointmentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  patient_id?: number;

  @IsOptional()
  @IsString()
  doctor?: string;
}
