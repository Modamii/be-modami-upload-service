import { ApiProperty } from '@nestjs/swagger';

export class ResponseMeta {
  @ApiProperty()
  public timestamp: number;

  @ApiProperty({ required: false })
  public stack?: string[];

  @ApiProperty({ required: false })
  public detailedError?: string;
}

export class ResponseError {
  @ApiProperty()
  public code: string;

  @ApiProperty()
  public message: string;
}

export class ResponseDto<T> {
  @ApiProperty()
  public success: boolean;

  public data?: T;

  public error?: ResponseError;

  @ApiProperty()
  public meta: ResponseMeta;

  public constructor(data: Partial<ResponseDto<T>>) {
    Object.assign(this, data);
  }
}
