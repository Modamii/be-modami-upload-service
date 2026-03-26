import { AN_HOUR_IN_MILLISECONDS } from '../constants';

export class TimeHelper {
  static getTimeAgo(hour: number): Date {
    return new Date(Date.now() - hour * AN_HOUR_IN_MILLISECONDS);
  }
}
