import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(150)
  age: number;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  contact: string;
}
