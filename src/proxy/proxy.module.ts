import { Module } from '@nestjs/common';
import { ApprenantController } from './apprenant.controller';
import { EntrepriseController } from './entreprise.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { AlternantController } from './alternant.controller';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
    imports: [KeycloakModule, LoggerModule],
    controllers:[ApprenantController, EntrepriseController, AlternantController],
})
export class ProxyModule {}
