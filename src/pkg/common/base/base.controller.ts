import {
  ClassConstructor,
  ClassTransformOptions,
  instanceToPlain,
} from 'class-transformer';

export class BaseController {
  private defaultTransformOptions: ClassTransformOptions;
  constructor() {
    this.defaultTransformOptions = {
      excludeExtraneousValues: true,
    };
  }

  expose<T>(
    cls: ClassConstructor<T>,
    object: object,
    options: ClassTransformOptions = {},
  ) {
    if (Array.isArray(object)) {
      return this.exposeArray(cls, object, options);
    } else {
      return this.exposeObject(cls, object, options);
    }
  }

  private exposeObject<T>(
    cls: ClassConstructor<T>,
    object: object,
    options: ClassTransformOptions = {},
  ) {
    const transformOptions = {
      ...this.defaultTransformOptions,
      ...options,
    };
    const instance = Object.assign(new cls(), object);
    return instanceToPlain(instance, transformOptions);
  }

  private exposeArray<T>(
    cls: ClassConstructor<T>,
    objects: object[],
    options: ClassTransformOptions = {},
  ) {
    const result = [];
    const transformOptions = {
      ...this.defaultTransformOptions,
      ...options,
    };

    for (const object of objects) {
      const instance = Object.assign(new cls(), object);
      const objectTransformed = instanceToPlain(instance, transformOptions);
      result.push(objectTransformed);
    }
    return result;
  }
}
