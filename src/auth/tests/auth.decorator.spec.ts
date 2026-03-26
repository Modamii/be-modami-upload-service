import { AuthUser } from '../decorators';
import { userInfoExpect } from './mocks';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Exception, EXCEPTIONS } from '../../common/exceptions';

describe('AuthDecorator', () => {
  const data = null; //AuthUser didn't use param data
  let factory;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function getParamDecoratorFactory(decorator: () => object): any {
    class TestAuthUserDecorator {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      test(@AuthUser() value): void {
        //do nothing
      }
    }

    const args = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestAuthUserDecorator,
      'test',
    );
    return args[Object.keys(args)[0]].factory;
  }

  const getRequestMock = jest.fn();

  const executionContextMock = {
    switchToHttp: (): any => ({ getRequest: getRequestMock }),
  };

  beforeEach(() => {
    factory = getParamDecoratorFactory(AuthUser);
  });

  describe('invalid user in request', () => {
    describe('undefine user', () => {
      const request = {};
      executionContextMock
        .switchToHttp()
        .getRequest.mockReturnValueOnce(request);

      it('should throw Exception', () => {
        try {
          factory(data, executionContextMock);
          throw new Error('not expected');
        } catch (error) {
          expect(error).toBeInstanceOf(Exception);
          expect(error.customCode).toEqual(
            EXCEPTIONS.COMMON.UNAUTHORIZED.customCode,
          );
        }
      });
    });

    describe('null user', () => {
      const request = { user: null };
      executionContextMock
        .switchToHttp()
        .getRequest.mockReturnValueOnce(request);

      it('should throw LogicException', () => {
        try {
          factory(data, executionContextMock);
          throw new Error('not expected');
        } catch (error) {
          expect(error).toBeInstanceOf(Exception);
          expect(error.customCode).toEqual(
            EXCEPTIONS.COMMON.UNAUTHORIZED.customCode,
          );
        }
      });
    });
  });

  describe('valid user in request', () => {
    describe('should ok', () => {
      const request = { user: userInfoExpect };
      executionContextMock
        .switchToHttp()
        .getRequest.mockReturnValueOnce(request);

      it('should return user', () => {
        expect(factory(data, executionContextMock)).toEqual(userInfoExpect);
      });
    });
  });
});
