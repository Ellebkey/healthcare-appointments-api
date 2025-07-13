import { IsString, IsNotEmpty } from 'class-validator';

export class FileUploadDto {
  @IsString()
  @IsNotEmpty()
  filepath: string;
}
