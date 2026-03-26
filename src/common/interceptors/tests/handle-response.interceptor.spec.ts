import { HandleResponseInterceptor } from '../handle-response.interceptor';
import { createMock } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { CUSTOM_CODE } from '../../constants/custom-code.constant';

describe('HandleResponseInterceptor', () => {
  let interceptor: HandleResponseInterceptor<any>;

  beforeEach(() => {
    interceptor = new HandleResponseInterceptor();
  });

  it('Should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('When convert response to ResponseDto with data has snake case property', () => {
    it('should successfully return', async () => {
      const inputData = {
        dataKey: 'dataKey',
      };
      const convertedDataExpect = { dataKey: 'dataKey' };

      const mockExecutionContext = createMock<ExecutionContext>();

      const mockNextHandler = createMock<CallHandler>({
        handle: jest.fn().mockReturnValue(of(inputData)),
      });

      const responseObserve = interceptor.intercept(
        mockExecutionContext,
        mockNextHandler,
      );

      const responseDto = await lastValueFrom(responseObserve);
      expect(mockNextHandler.handle).toBeCalled();
      expect(responseDto.data).toEqual(convertedDataExpect);
      expect(responseDto.code).toEqual(CUSTOM_CODE.SUCCESS);
    });
  });
});
