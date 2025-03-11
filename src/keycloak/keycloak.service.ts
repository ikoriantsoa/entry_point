import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class KeycloakService {
  private readonly keycloakAdminClient = axios.create({
    baseURL: `${process.env.AUTH_SERVER_URL}/admin/realms/${process.env.REALM}`,
    headers: {
      Authorization: `Bearer ${this.getAdminAccesToken()}`,
    },
  });

  private async getAdminAccesToken(): Promise<string> {
   
    
    try {
      const response = await axios.post(
        `${process.env.AUTH_SERVER_URL}/realms/${process.env.REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: `${process.env.CLIENT_ID}`,
          client_secret: `${process.env.CLIENT_SECRET}`,
        }),
        {
          headers: { 'Content-type': 'application/x-www-form-urlencoded' },
        },
      );

      console.log('Admin token', response.data.access_token);
      
      return response.data.access_token;
    } catch (error) {
      console.error(error);
      throw new Error('Impossible de récupérer le token admin');
    }
  }

  private async getAxiosClient() {
    const accessToken = await this.getAdminAccesToken();
    return axios.create({
      baseURL: `${process.env.AUTH_SERVER_URL}/admin/realms/${process.env.REALM}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  public verifierToken(token: string): string | jwt.JwtPayload {
    try {
      const publicKey: string = `${process.env.PUBLIC_KEY}`;
      return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } catch (error) {
      console.error(error);
      throw new Error('Token invalide');
    }
  }

  public async updateUserRoles(userId: string, rolename: string) {
    try {
      const keycloakClient = await this.getAxiosClient();

      const rolesResponse = await keycloakClient.get('/roles');
      const roleDisponible = rolesResponse.data;

      const userRolesResponse = await keycloakClient.get(
        `/users/${userId}/role-mappings/realm`,
      );
      const roleCourant = userRolesResponse.data;

      if (roleCourant && roleCourant.length > 0) {
        const rolesToDelete = roleCourant.map((role: any) => ({
          id: role.id,
          name: role.name,
        }));

        await keycloakClient.delete(`/users/${userId}/role-mappings/realm`, {
          data: rolesToDelete,
        });
      }

      const ajoutRole = roleDisponible.find(
        (role: any) => role.name === rolename,
      );
      if (!ajoutRole) {
        throw new HttpException(
          `Le rôle "${rolename}" n'existe pas dans Keycloak`,
          HttpStatus.NOT_FOUND,
        );
      }

      const payload = [
        {
          id: ajoutRole.id,
          name: ajoutRole.name,
        },
      ];

      await keycloakClient.post(
        `/users/${userId}/role-mappings/realm`,
        payload,
      );
    } catch (error) {
      console.error(
        'Erreur lors de la mise à jour des rôles :',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Erreur lors de la mise à jour des rôles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public extractIdToken(token: string) {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      if (!decoded || !decoded.sub) {
        throw new Error(`L'id est manquant dans le token`);
      }

      return decoded.sub;
    } catch (error) {
      console.error(`Erreur lors de l'extraction de l'id de l'utilisateur`);
      throw new Error('Token invalide ou manquant');
    }
  }

  public extractUsername(token: string) {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      if (!decoded || !decoded.preferred_username) {
        throw new Error(`L'username est manquant dans le token`);
      }

      return decoded.preferred_username;
    } catch (error) {
      console.error(`Erreur lors de l'exécution de l'username`);
      throw new Error('Token invalide ou manquant');
    }
  }

  public extractEmail(token: string) {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      if (!decoded || !decoded.email) {
        throw new Error(`L'email est manquant dans le token`);
      }

      return decoded.email;
    } catch (error) {
      console.error(`Erreur lors de l'exécution de l'email`);
      throw new Error('Token invalide ou manquant');
    }
  }
}
