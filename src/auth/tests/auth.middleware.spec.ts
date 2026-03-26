import { Request } from 'express';
import { AuthService } from '../auth.service';
import { AuthMiddleware } from '../auth.middleware';
import { authInput, userInfoExpect } from './mocks';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EXCEPTIONS } from '../../common/exceptions';
import { mockClass } from '../../common/helpers';
import { CacheManageService } from '../../third-parties/cache/src';

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  const authServiceMock = mockClass<AuthService>();
  const cacheManageServiceMock = mockClass<CacheManageService>();

  const next = jest.fn();

  const res = null;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: CacheManageService,
          useValue: cacheManageServiceMock,
        },
        AuthMiddleware,
      ],
    }).compile();

    authMiddleware = module.get<AuthMiddleware>(AuthMiddleware);
  });

  describe('header user valid', () => {
    const req = {
      headers: {
        user: JSON.stringify({
          email: '123@gmail.com',
          'cognito:username': 'test',
          'custom:user_uuid': 'e750c6d5-81b0-4d81-a545-541ecfbffa50',
          'custom:bein_staff_role': true,
        }),
      },
    };

    it('should ok', async () => {
      authServiceMock.getUser.mockReturnValue({});
      cacheManageServiceMock.getSharedCacheService.mockReturnValue({
        get() {
          return { id: 123 };
        },
      });
      await authMiddleware.use(req as any, res, next);
      expect(next).toBeCalled();
    });
  });

  describe('invalid authorization', () => {
    describe('undefine authorization', () => {
      const req = {
        headers: {},
      };

      it('should throw UnauthorizedException', async () => {
        try {
          cacheManageServiceMock.getSharedCacheService.mockReturnValue({
            get() {
              return null;
            },
          });
          await authMiddleware.use(req as Request, res, next);
        } catch (e) {
          expect(e.customCode).toEqual(
            EXCEPTIONS.COMMON.UNAUTHORIZED.customCode,
          );
        }
      });
    });

    describe('null authorization', () => {
      const req = {
        headers: {
          authorization: null,
        },
      };

      it('should throw UnauthorizedException', async () => {
        try {
          await authMiddleware.use(req as Request, res, next);
        } catch (e) {
          expect(e.customCode).toEqual(
            EXCEPTIONS.COMMON.UNAUTHORIZED.customCode,
          );
        }
      });
    });

    describe('empty authorization', () => {
      const req = {
        headers: {
          authorization: '',
        },
      };

      authServiceMock.login.mockRejectedValue(
        new UnauthorizedException('Unauthorized'),
      );

      it('should throw UnauthorizedException', async () => {
        try {
          await authMiddleware.use(req as Request, res, next);
        } catch (e) {
          expect(e.customCode).toEqual(
            EXCEPTIONS.COMMON.UNAUTHORIZED.customCode,
          );
        }
      });
    });
  });

  describe('valid authorization', () => {
    describe('valid authorization', () => {
      const req = {
        headers: {
          authorization: authInput.tokenValid,
        },
        user: null,
      };

      it('Request should have data in req.user', async () => {
        authServiceMock.login.mockReturnValueOnce(userInfoExpect);

        await authMiddleware.use(req as Request, res, next);

        expect(req.user).toEqual(userInfoExpect);
        expect(next).toBeCalled();
      });
    });
  });
});
