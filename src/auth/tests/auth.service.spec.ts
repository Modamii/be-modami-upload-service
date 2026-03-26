import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { authInput, userInfoExpect, cognitoKeys, payLoad } from './mocks';
import { UserDto } from '../dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import { EXCEPTIONS } from '../../common/exceptions';

const httpServiceMock = {
  get: (): Observable<any> => {
    return new Observable<AxiosResponse>((subscriber) => {
      subscriber.next({
        data: { keys: cognitoKeys },
        config: null,
        headers: null,
        status: null,
        statusText: null,
      });
      subscriber.complete();
    });
  },
};

const configServiceMock = {
  get: (): object => ({
    region: 'vn',
    poolId: 1,
  }),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('AuthService should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('function - login - verify token', () => {
    describe('invalid token', () => {
      describe('null token', () => {
        it('should throw an UnauthorizedException', async () => {
          try {
            await authService.login(authInput.nullToken);
          } catch (e) {
            expect(e.customCode).toEqual(
              EXCEPTIONS.COMMON.UNAUTHORIZED.customCode,
            );
          }
        });
      });

      describe('undefined token', () => {
        it('should throw an UnauthorizedException', async () => {
          try {
            await authService.login(undefined);
          } catch (e) {
            expect(e.customCode).toEqual(
              EXCEPTIONS.COMMON.UNAUTHORIZED.customCode,
            );
          }
        });
      });

      describe('empty token', () => {
        it('should throw an UnauthorizedException', async () => {
          try {
            await authService.login('');
          } catch (e) {
            expect(e.customCode).toEqual(
              EXCEPTIONS.COMMON.UNAUTHORIZED.customCode,
            );
          }
        });
      });

      describe('fake token', () => {
        it('should throw an UnauthorizedException', async () => {
          try {
            await authService.login(authInput.tokenInvalid);
          } catch (e) {
            expect(e.customCode).toEqual(
              EXCEPTIONS.COMMON.UNAUTHORIZED.customCode,
            );
          }
        });
      });

      describe('expired token', () => {
        it('should throw an UnauthorizedException', async () => {
          jest.spyOn(jwt, 'verify').mockImplementation(() => {
            throw new jwt.TokenExpiredError('Token Expired Error', new Date());
          });
          try {
            await authService.login(authInput.expiredToken);
          } catch (e) {
            expect(e.customCode).toEqual(
              EXCEPTIONS.COMMON.AUTH_TOKEN_EXPIRED.customCode,
            );
          }
        });
      });
    });
    describe('valid token', () => {
      it('should return the user data', async () => {
        jest.spyOn(jwt, 'verify').mockImplementation(() => payLoad);

        const user = await authService.login(authInput.tokenValid);
        expect(user).toBeInstanceOf(UserDto);
      });
    });
  });
});
