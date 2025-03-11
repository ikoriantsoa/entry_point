import { Module } from '@nestjs/common';
import { ApprenantController } from './apprenant.controller';
import { EntrepriseController } from './entreprise.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
    imports: [KeycloakModule],
    controllers:[ApprenantController, EntrepriseController],
})
export class ProxyModule {}
