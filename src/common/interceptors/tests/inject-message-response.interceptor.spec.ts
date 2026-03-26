import '../../extension';
import { of } from 'rxjs';
import { createMock } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { InjectMessageResponseInterceptor } from '../inject-message-response.interceptor';

describe('InjectMessageResponseInterceptor:', () => {
  let mockExecutionContext: ExecutionContext;
  let mockNextHandler: CallHandler;
  let response: Record<string, any>;

  beforeEach(() => {
    response = {};
    mockExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getResponse: jest.fn().mockReturnValue(response),
      }),
    });
    mockNextHandler = createMock<CallHandler>({
      handle: () => of({}),
    });
  });

  it('Mock should defined', function () {
    expect(mockNextHandler.handle()).toBeDefined();

    expect(mockExecutionContext.switchToHttp().getResponse()).toBeDefined();
  });

  describe('When message not null:', function () {
    let interceptor: InjectMessageResponseInterceptor;
    const mockMessages = {
      validator: {
        fails: 'validator fails',
      },
      success: 'success',
      forbidden: 'forbidden',
    };

    beforeEach(() => {
      interceptor = new InjectMessageResponseInterceptor(mockMessages);
    });

    it('Interceptor should defined:', function () {
      expect(interceptor).toBeDefined();
    });

    it('Add message to response', (done) => {
      const expectResponse = {
        responseMessage: {
          validator: {
            fails: 'validator fails',
          },
          success: 'success',
          forbidden: 'forbidden',
        },
      };
      interceptor.intercept(mockExecutionContext, mockNextHandler).subscribe({
        next: () => null,
        error: () => {
          throw new Error('Run fails');
        },
        complete: () => {
          expect(response).toEqual(expectResponse);
          done();
        },
      });
    });
  });

  describe('When message null:', function () {
    let interceptor: InjectMessageResponseInterceptor;

    beforeEach(() => {
      interceptor = new InjectMessageResponseInterceptor(null);
    });

    it('Interceptor should defined', function () {
      expect(interceptor).toBeDefined();
    });

    it('Add null message to response', (done) => {
      const expectResponse = {
        responseMessage: null,
      };

      interceptor.intercept(mockExecutionContext, mockNextHandler).subscribe({
        next: () => null,
        error: () => {
          throw new Error('Run fails');
        },
        complete: () => {
          expect(response).toEqual(expectResponse);
          done();
        },
      });
    });
  });

  describe('When message undefined:', function () {
    let interceptor: InjectMessageResponseInterceptor;

    beforeEach(() => {
      interceptor = new InjectMessageResponseInterceptor(undefined);
    });

    it('Interceptor should defined', function () {
      expect(interceptor).toBeDefined();
    });

    it('Add undefined message to response', (done) => {
      const expectResponse = {
        responseMessage: undefined,
      };
      interceptor.intercept(mockExecutionContext, mockNextHandler).subscribe({
        next: () => null,
        error: () => {
          throw new Error('Run fails');
        },
        complete: () => {
          expect(response).toEqual(expectResponse);
          done();
        },
      });
    });
  });
});
