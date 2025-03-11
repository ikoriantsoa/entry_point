import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { KeycloakModule } from './keycloak/keycloak.module';
import { ProxyModule } from './proxy/proxy.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './keycloak/roles.guard';
import { AuthMiddleware } from './keycloak/auth.midleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    KeycloakModule,
    ProxyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ],
})
export class AppModule implements NestModule{
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
