import { HttpStatus } from '@nestjs/common';
import { IException } from './dto/exception';
import { I18nContext } from 'nestjs-i18n';

export class Exception implements IException {
  customCode?: string;
  message?: string;
  detailedError?: string;
  requestId?: string;
  statusCode?: number;
  params?: {};
  stack: string;
  constructor(obj?: IException) {
    const context = I18nContext.current();
    const message: string = context ? context.t(obj?.message) : obj?.message;
    this.setDefault();
    if (obj) {
      this.withFields({ ...obj, message });
    }
  }

  withFields(obj: IException) {
    Object.assign(this, obj);
    if (!this.stack) {
      this.addStack();
    }
    return this;
  }

  private setDefault() {
    this.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private addStack() {
    this.stack = new Error().stack;
    this.removeExceptionStack();
  }

  private removeExceptionStack() {
    this.stack = this.stack.replace(/\n.+\sException(\.|\s).+\)/gm, '');
  }
}
