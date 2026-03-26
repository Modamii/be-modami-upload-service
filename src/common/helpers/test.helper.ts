import { createMock, DeepMocked } from '@golevelup/ts-jest';

export function testIfDecoratorsAreApplied(
  func: any,
  decorators: string[] = [],
) {
  it('the required decorators are applied', () => {
    decorators = [
      'swagger/apiOperation',
      'swagger/apiResponse',
      'path',
      'method',
    ].concat(decorators);

    decorators.forEach((key) => {
      const test = Reflect.getMetadataKeys(func).includes(key);
      try {
        expect(test).toBe(true);
      } catch (e) {
        fail(`Missing '${key}' decorator for function ${func.name}`);
      }
    });
  });
}

export type MockClass<T> = {
  [key in keyof T]: jest.Mock<any, any>;
} & DeepMocked<T>;

export function mockClass<T extends object>(): MockClass<T> {
  return createMock<T>() as MockClass<T>;
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
