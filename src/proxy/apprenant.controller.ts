import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';
import { KeycloakService } from 'src/keycloak/keycloak.service';
import { Roles } from 'src/keycloak/roles.decorator';
import { RolesGuard } from 'src/keycloak/roles.guard';
import { CreateApprenantDto } from './dto/dtoApprenant/CreateApprenant.dto';

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

  constructor(private readonly keycloakService: KeycloakService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('anonyme')
  public createApprenant(
    @Headers('authorization') authHeader: string,
    @Body() createApprenantDto: CreateApprenantDto,
  ) {
    const token = authHeader.split(' ')[1];

    const sub = this.keycloakService.extractIdToken(token);
    const username = this.keycloakService.extractUsername(token);
    const email = this.keycloakService.extractEmail(token);

    const dataApprenant = {
      keycloak_id: sub,
      username: username,
      email: email,
      lastname: createApprenantDto.lastname,
      firstname: createApprenantDto.firstname,
      adresse: createApprenantDto.adresse,
    };

    try {
      this.keycloakService.updateUserRoles(sub!, 'apprenant');
    } catch (error) {
      console.log(error);
      throw new Error('Erreur lors de la mise à jour du rôle');
    }

    return this.apprenantClientProxy.send('createApprenant', dataApprenant);
  }
}
