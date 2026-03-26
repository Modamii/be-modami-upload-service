export class ObjectHelper {
  static whiteList<T>(obj: T, whiteList: string[]): T {
    for (const field in obj) {
      if (!whiteList.includes(field)) {
        delete obj[field];
      }
    }
    return obj;
  }

  static pick(obj: object, whiteList: string[]): object {
    const result = {};
    for (const field in obj) {
      if (whiteList.includes(field)) {
        result[field] = obj[field];
      }
    }
    return obj;
  }
}
