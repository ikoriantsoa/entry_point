import { IsNotEmpty, IsString } from 'class-validator';

export class CreateApprenantDto {

  @IsString()
  @IsNotEmpty()
  lastname: string;
  
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  adresse: string;
}
