import { IsNotEmpty, IsString } from 'class-validator';

export class ICreateWebinaireApprenantDto {
  titre: string;

  categorie: string;

  type: string;

  niveau: string;

  image: Express.Multer.File;

  source: Express.Multer.File;
}
