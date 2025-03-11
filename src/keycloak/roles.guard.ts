  import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { ROLES_KEY } from './roles.decorator';

  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
      const requiredRoles: string[] = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      console.log(requiredRoles);
      

      if (!requiredRoles) {
        console.log(requiredRoles);
        
        return false;
      }

      const request = context.switchToHttp().getRequest();
      
      const user = request.user;

      console.log(user);

      if (!user) {
        throw new ForbiddenException('Utilisateur non authentitfié');
      }

      const userRoles = user?.realm_access?.roles || [];
      
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role),
      );

      if (!hasRequiredRole) {
        throw new ForbiddenException('Accès refusé: rôle insuffisant');
      }
      return true;
    }
  }
