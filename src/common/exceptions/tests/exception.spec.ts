import { Exception, EXCEPTIONS } from '../';

describe('LogicException', () => {
  it('should load default info', () => {
    const exception = new Exception(EXCEPTIONS.VIDEO.VIDEO_ID_HAS_BEEN_USED);
    expect(exception.customCode).toEqual(
      EXCEPTIONS.VIDEO.VIDEO_ID_HAS_BEEN_USED.customCode,
    );
    expect(exception.message).toEqual(
      EXCEPTIONS.VIDEO.VIDEO_ID_HAS_BEEN_USED.message,
    );
    expect(exception.statusCode).toEqual(
      EXCEPTIONS.VIDEO.VIDEO_ID_HAS_BEEN_USED.statusCode,
    );
  });

  it('should generate more info', () => {
    const exception = new Exception(
      EXCEPTIONS.VIDEO.VIDEO_ID_HAS_BEEN_USED,
    ).withFields({
      message: 'hello',
      detailedError: 'alo!',
    });
    expect(exception.message).toEqual('hello');
    expect(exception.detailedError).toEqual('alo!');
  });
});
