import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';
import { KeycloakService } from 'src/keycloak/keycloak.service';
import { RolesGuard } from 'src/keycloak/roles.guard';
import { Roles } from 'src/keycloak/roles.decorator';
import { CreateEntrepriseDto } from './dto/dtoEntreprise/CreateEntreprise.dto';

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

  constructor(private readonly keycloakService: KeycloakService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('anonyme')
  public createEntreprise(
    @Headers('authorization') authHeader: string,
    @Body() createEntrepriseDto: CreateEntrepriseDto,
  ) {
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

    try {
      this.keycloakService.updateUserRoles(sub!, 'entreprise');
    } catch (error) {
      console.log(error);
      throw new Error('Erreur lors de la mise à jour du rôle');
    }

    return this.entrepriseClientProxy.send('createEntreprise', dataEntreprise);
  }
}
