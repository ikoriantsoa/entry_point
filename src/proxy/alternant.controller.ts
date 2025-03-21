import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { KeycloakService } from 'src/keycloak/keycloak.service';
import { Roles } from 'src/keycloak/roles.decorator';
import { RolesGuard } from 'src/keycloak/roles.guard';
import { ICreateWebinaireApprenantDto } from './dto/dtoWebinaireApprenant/CreateWebinaireApprenant.dto';
import { LoggerService } from '../logger/logger.service';

@Controller('alternant')
export class AlternantController {
  @Client({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 9003,
    },
  })
  private alternantClientProxy: ClientProxy;

  constructor(private readonly keycloakService: KeycloakService, private readonly logger: LoggerService) {
    this.logger.setContext(AlternantController.name);
  }

  /**
   * @param {string} authHeaders - Cela contient le token de l'utilisateur
   * @param {ICreateWebinaireApprenantDto} createWebinaireApprenant - Contient le dto du webinaire alternant
   * @returns
   */
  @Post('webinaire')
  @UseGuards(RolesGuard)
  @Roles('alternant')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'source', maxCount: 1 },
    ]),
  )
  public createWebinaire(
    @Headers('authorization') authHeaders: string,
    @Body() createWebinaireApprenant: ICreateWebinaireApprenantDto,
    @UploadedFiles()
    files: {
      image: Express.Multer.File[];
      source: Express.Multer.File[];
    },
  ) {
    this.logger.log(`Méthode pour la création d'un webinaire alternant`);
    const token: string = authHeaders.split(' ')[1];
    const keycloak_id_auteur: string =
      this.keycloakService.extractIdToken(token);

    const dataWebinaire = {
      keycloak_id_auteur: keycloak_id_auteur,
      titre: createWebinaireApprenant.titre,
      categorie: createWebinaireApprenant.categorie,
      type: createWebinaireApprenant.type,
      niveau: createWebinaireApprenant.niveau,
      image: files.image?.[0],
      source: files.source?.[0],
    };

    this.logger.log(`Récupération des donnés pour la creéation d'un webinaire alternant`);

    return this.alternantClientProxy.send(
      'createWebinaireAlternant',
      dataWebinaire,
    );
  }

  @Get('webinaire/my_webinaire')
  @UseGuards(RolesGuard)
  @Roles('alternant')
  public getAllWebinaireAlternant(
    @Headers('authorization') authHeader: string,
  ) {
    this.logger.log(`Méthode pour voir tous les webinaires d'un alternant`);
    const token: string = authHeader.split(' ')[1];
    const keycloak_id_auteur: string =
      this.keycloakService.extractIdToken(token);
    return this.alternantClientProxy.send(
      'getAllWebinaireAlternant',
      keycloak_id_auteur,
    );
  }

  @Get('webinaire/all')
  @UseGuards(RolesGuard)
  @Roles('alternant')
  public getAllWebinaire() {
    this.logger.log(`Métode pour voir tous les webinaires en global`);
    return this.alternantClientProxy.send('getAllWebinaire', {});
  }
}
