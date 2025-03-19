import {
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  Param,
  Post,
  UnauthorizedException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';
import { KeycloakService } from 'src/keycloak/keycloak.service';
import { Roles } from 'src/keycloak/roles.decorator';
import { RolesGuard } from 'src/keycloak/roles.guard';
import { CreateApprenantDto } from './dto/dtoApprenant/CreateApprenant.dto';
import { Observable } from 'rxjs';
import { ICreateWebinaireApprenantDto } from './dto/dtoWebinaireApprenant/CreateWebinaireApprenant.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { LoggerService } from '../logger/logger.service';

@Controller('apprenant')
export class ApprenantController {
  @Client({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 9001,
    },
  })
  private apprenantClientProxy: ClientProxy;

  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(ApprenantController.name);
  }

  /**
   * Cette méthode permet de créer d'envoyer un message au microservice apprenant
   * @param {string} authHeader - Contint le token qui permet de vérifier l'apprenant
   * @param {CreateApprenantDto} createApprenantDto - Contient les informations de l'apprenant
   * @returns {Observable<any>} - Retourne le message à envoyer au bon contrôleur du microservice apprenant
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('anonyme')
  public createApprenant(
    @Headers('authorization') authHeader: string,
    @Body() createApprenantDto: CreateApprenantDto,
  ): Observable<any> {
    this.logger.log(`Appel de la méthode d'insertion d'un nouveau apprenant`);
    const token: string = authHeader.split(' ')[1];

    const sub: string = this.keycloakService.extractIdToken(token);
    const username: string = this.keycloakService.extractUsername(token);
    const email: string = this.keycloakService.extractEmail(token);

    const dataApprenant = {
      keycloak_id: sub,
      username: username,
      email: email,
      lastname: createApprenantDto.lastname,
      firstname: createApprenantDto.firstname,
      adresse: createApprenantDto.adresse,
    };
    this.logger.log(`Enregistrement réussi des données d'un utilisateur`);

    try {
      this.keycloakService.updateUserRoles(sub!, 'apprenant');
      this.logger.log(`Mise à jour du rôle de l'utilisateur id: ${sub} en 'apprenant'`);
    } catch (error) {
      console.log(error);
      this.logger.error(`Utilisateur id: ${sub} - Erreur lors de la mise à jour du rôle | ${error}`);
      
      throw new Error('Erreur lors de la mise à jour du rôle');
    }
    this.logger.log(`Envoi des données de l'utilisateur ${sub} vers le contrôleur apprenant`);
    return this.apprenantClientProxy.send('createApprenant', dataApprenant);
  }

  @Post('webinaire')
  @UseGuards(RolesGuard)
  @Roles('apprenant')
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
    this.logger.log(`Appel de la méthode d'insertion d'un nouveau apprenant`);
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

    this.logger.log(`Enregistrement réussi des données d'un apprenant`);
    this.logger.log(`Envoi des données de l'apprenant vers le contrôleur apprenant`);

    return this.apprenantClientProxy.send('createWebinaire', dataWebinaire);
  }

  @Get('webinaire/my_webinaire')
  @UseGuards(RolesGuard)
  @Roles('apprenant')
  public getAllWebinaireApprenant(
    @Headers('authorization') authHeader: string,
  ) {
    this.logger.log(`Méthode pour voir tous les webinaires apprenants`);

    const token: string = authHeader.split(' ')[1];
    const keycloak_id_auteur: string =
      this.keycloakService.extractIdToken(token);
    return this.apprenantClientProxy.send(
      'getAllWebinaireApprenant',
      keycloak_id_auteur,
    );
  }

  @Get('webinaire/all')
  @UseGuards(RolesGuard)
  @Roles('apprenant')
  public getAllWebinaire() {
    this.logger.log(`Méthode pour voir tous les webinaires apprenants `);
    return this.apprenantClientProxy.send('getAllWebinaire', {});
  }

  @Get('webinaire/:webinaireId')
  @UseGuards(RolesGuard)
  @Roles('apprenant')
  public async getWebinaireById(
    @Headers('authorization') authHeader: string,
    @Param('webinaireId') webinaireId: string,
  ) {
    this.logger.log(`Méthode pour voir un webinaire apprenant`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant ou invalide');
    }

    const token: string = authHeader.split(' ')[1];
    let keycloak_id_auteur: string;

    try {
      keycloak_id_auteur = this.keycloakService.extractIdToken(token);
    } catch (error) {
      this.logger.error('Échec de la validation du token');
      throw new UnauthorizedException('Échec de la validation du token');
    }

    try {
      return await this.apprenantClientProxy
        .send('getWebinaireById', { webinaireId, keycloak_id_auteur })
        .toPromise();
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du webinaire');
      throw new InternalServerErrorException(
        'Erreur lors de la récupération du webinaire',
      );
    }
  }
}
