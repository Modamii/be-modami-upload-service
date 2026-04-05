import { UserDto } from './dto';
import jwkToPem from 'jwk-to-pem';
import * as jwt from 'jsonwebtoken';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ICognitoConfig } from '../configs/config.interface';
import { TokenExpiredError } from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import { ClassTransformer } from 'class-transformer';
import { Exception, EXCEPTIONS } from '../common/exceptions';

@Injectable()
export class AuthService {
  private classTransformer = new ClassTransformer();

  public constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  public getUser(payload: Record<string, any>): UserDto {
    const user = this.classTransformer.plainToInstance(UserDto, {
      email: payload['email'],
      username: payload['cognito:username'],
      // Cognito uses custom:user_uuid; Keycloak/OIDC uses sub
      id: payload['custom:user_uuid'] || payload['sub'],
    });

    return user;
  }

  private async getJwksUrl(decodedJwt: jwt.Jwt): Promise<string> {
    const payload = decodedJwt.payload as Record<string, any>;
    const issuer: string = payload['iss'] ?? '';

    // Cognito issuer: https://cognito-idp.{region}.amazonaws.com/{poolId}
    if (issuer.includes('cognito-idp') || issuer.includes('amazoncognito')) {
      const cognitoConfig = this.configService.get<ICognitoConfig>('cognito');
      return `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.poolId}/.well-known/jwks.json`;
    }

    // Generic OIDC (Keycloak, Auth0, etc.): {issuer}/.well-known/openid-configuration
    const discoveryUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
    try {
      const discovery = await lastValueFrom(
        this.httpService.get(discoveryUrl),
      );
      return discovery['data']['jwks_uri'];
    } catch {
      // Fallback: Keycloak JWKS path
      return `${issuer.replace(/\/$/, '')}/protocol/openid-connect/certs`;
    }
  }

  public async login(token: string): Promise<UserDto> {
    const decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) {
      throw new Exception(EXCEPTIONS.COMMON.UNAUTHORIZED).withFields({
        detailedError: `token=${token}`,
      });
    }

    const tokenValidationUrl = await this.getJwksUrl(decodedJwt);
    const response = await lastValueFrom(
      this.httpService.get(tokenValidationUrl),
    );
    const keys = response['data']['keys'];
    const pems = keys
      .map((key) => {
        const keyId = key.kid;
        const modulus = key.n;
        const exponent = key.e;
        const keyType = key.kty;
        const jwk = { kty: keyType, n: modulus, e: exponent };
        return {
          [keyId]: jwkToPem(jwk),
        };
      })
      .reduce((obj, item) => ({ ...obj, ...item }), {});

    const kid = decodedJwt['header']['kid'];
    const pem = pems[kid];
    if (!pem) {
      throw new Exception(EXCEPTIONS.COMMON.UNAUTHORIZED).withFields({
        detailedError: `pem=${pem}`,
      });
    }
    let payload;

    try {
      payload = await jwt.verify(token, pem);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new Exception(EXCEPTIONS.COMMON.AUTH_TOKEN_EXPIRED);
      }
      throw new Exception(EXCEPTIONS.COMMON.UNAUTHORIZED);
    }

    if (!payload) {
      throw new Exception(EXCEPTIONS.COMMON.UNAUTHORIZED).withFields({
        detailedError: `payload=${payload}`,
      });
    }

    return this.getUser(payload);
  }
}
