import { Injectable, NestMiddleware } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly keycloakService: KeycloakService) {}

  public use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    console.log('authHeader:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: `Token manquant ou invalide` });
    }

    const token = authHeader.split(' ')[1];
    console.log('token: ', token);

    const sub = this.keycloakService.extractIdToken(token);
    console.log('sub: ', sub);

    const email = this.keycloakService.extractEmail(token);
    console.log('email: ', email);

    const username = this.keycloakService.extractUsername(token);
    console.log('username: ', username);

    try {
      const user = this.keycloakService.verifierToken(token);

      req['user'] = user;

      next();
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: 'Token invalide' });
    }
  }
}
