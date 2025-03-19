import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';
import { KeycloakService } from 'src/keycloak/keycloak.service';
import { RolesGuard } from 'src/keycloak/roles.guard';
import { Roles } from 'src/keycloak/roles.decorator';
import { CreateEntrepriseDto } from './dto/dtoEntreprise/CreateEntreprise.dto';
import { LoggerService } from '../logger/logger.service';

@Controller('entreprise')
export class EntrepriseController {
  @Client({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 9002,
    },
  })
  private entrepriseClientProxy: ClientProxy;

  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(EntrepriseController.name);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('anonyme')
  public createEntreprise(
    @Headers('authorization') authHeader: string,
    @Body() createEntrepriseDto: CreateEntrepriseDto,
  ) {
    this.logger.log(`Méthode pour créer une enreprise`);

    const token = authHeader.split(' ')[1];

    const sub = this.keycloakService.extractIdToken(token);
    const username = this.keycloakService.extractUsername(token);
    const email = this.keycloakService.extractEmail(token);

    const dataEntreprise = {
      keycloak_id: sub,
      username: username,
      email: email,
      nom_entreprise: createEntrepriseDto.nom_entreprise,
      secteur_activite: createEntrepriseDto.secteur_activite,
      adresse: createEntrepriseDto.adresse,
      site_web: createEntrepriseDto.site_web,
    };

    this.logger.log(`Récupération des données de l'entreprise`);

    try {
      this.keycloakService.updateUserRoles(sub!, 'entreprise');
      this.logger.log(`Mise à jour du rôle en entreprise`);
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour du rôle`);
      throw new Error('Erreur lors de la mise à jour du rôle');
    }
    this.logger.log(`Envoi des informations de l'entreprise au microservice`);
    return this.entrepriseClientProxy.send('createEntreprise', dataEntreprise);
  }
}
