import { MyLogger } from '../logger.service';

describe('MyLogger', () => {
  const logger = new MyLogger();
  describe('toJson', () => {
    it('input string', async () => {
      expect(logger.toJson(['abc', 'UsersService'])).toEqual({
        message: 'abc',
        context: 'UsersService',
      });

      expect(logger.toJson(['abc'])).toEqual({
        message: 'abc',
      });

      expect(logger.toJson(['abc', 'bcd', 'efg'])).toEqual({
        message: JSON.stringify(['abc', 'bcd', 'efg']),
      });
    });

    it('input object', async () => {
      expect(
        logger.toJson([{ message: '123', userId: 1 }, 'UsersService']),
      ).toEqual({
        message: '123',
        userId: 1,
        context: 'UsersService',
      });

      const err = new Error('adad');
      expect(
        logger.toJson([
          { message: 'upload failed', videoId: 1, err: err },
          'UsersService',
        ]),
      ).toEqual({
        message: 'upload failed',
        videoId: 1,
        context: 'UsersService',
        err: {
          message: err.message,
          stack: err.stack,
        },
      });

      expect(
        logger.toJson([
          { message: 'upload failed', videoId: 1, error: err },
          'UsersService',
        ]),
      ).toEqual({
        message: 'upload failed',
        videoId: 1,
        context: 'UsersService',
        error: {
          message: err.message,
          stack: err.stack,
        },
      });

      expect(logger.toJson([{ message: '123', userId: 1 }])).toEqual({
        message: '123',
        userId: 1,
      });

      expect(
        logger.toJson([{ message: '123', userId: 1 }, 'bcd', 'efg']),
      ).toEqual({
        message: '123',
        userId: 1,
      });
    });

    it('input number', async () => {
      expect(logger.toJson([1, 'UsersService'])).toEqual({
        message: JSON.stringify([1, 'UsersService']),
      });

      expect(logger.toJson([1])).toEqual({
        message: JSON.stringify([1]),
      });

      expect(logger.toJson([1, 3, 'efg'])).toEqual({
        message: JSON.stringify([1, 3, 'efg']),
      });
    });

    it('input error', async () => {
      const err = new Error('hello');
      expect(logger.toJson([err, 'UsersService'])).toEqual({
        message: err.message,
        stack: err.stack,
        context: 'UsersService',
      });

      expect(logger.toJson([err])).toEqual({
        message: err.message,
        stack: err.stack,
      });

      expect(logger.toJson([err, 3, 'efg'])).toEqual({
        message: err.message,
        stack: err.stack,
      });
    });
  });
});
