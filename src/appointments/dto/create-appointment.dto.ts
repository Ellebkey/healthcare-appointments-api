import { IsString, IsNumber, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber()
  @IsNotEmpty()
  patient_id: number;

  @IsString()
  @IsNotEmpty()
  doctor: string;

  @IsDateString()
  @IsNotEmpty()
  appointment_date: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
