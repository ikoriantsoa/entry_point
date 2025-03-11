import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateEntrepriseDto {
  @IsString()
  @IsNotEmpty()
  nom_entreprise: string;

  @IsString()
  @IsNotEmpty()
  secteur_activite: string;

  @IsString()
  @IsNotEmpty()
  adresse: string;

  @IsNotEmpty()
  @Matches(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/)
  site_web: string;
}
