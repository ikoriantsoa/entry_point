import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.HOST,
      port: Number(process.env.PORT_APPRENANT),
    }
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.HOST,
      port: Number(process.env.PORT_ENTREPRISE),
    }
  });

  app.useGlobalPipes(new ValidationPipe());

  const logger = new LoggerService();
  app.useLogger(logger);

  await app.listen(Number(process.env.PORT));
}
bootstrap();
