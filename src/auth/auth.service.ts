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
      id: payload['custom:user_uuid'],
      // staffRole: payload['custom:bein_staff_role'],
    });

    return user;
  }

  public async login(token: string): Promise<UserDto> {
    const decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) {
      throw new Exception(EXCEPTIONS.COMMON.UNAUTHORIZED).withFields({
        detailedError: `token=${token}`,
      });
    }

    const cognitoConfig = this.configService.get<ICognitoConfig>('cognito');
    const tokenValidationUrl = `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.poolId}/.well-known/jwks.json`;
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
