import { Module } from '@nestjs/common';
import { ApprenantController } from './apprenant.controller';
import { EntrepriseController } from './entreprise.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { AlternantController } from './alternant.controller';

@Module({
    imports: [KeycloakModule],
    controllers:[ApprenantController, EntrepriseController, AlternantController],
})
export class ProxyModule {}
