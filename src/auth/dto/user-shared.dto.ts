import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UserDataShareDto {
  @ApiProperty({
    description: 'User ID',
    type: String,
  })
  @Expose()
  @IsNotEmpty()
  public id: string;

  @ApiProperty({
    description: 'Username',
    type: String,
  })
  @Expose()
  @IsOptional()
  public username?: string;

  @ApiProperty({
    description: 'Fullname',
    type: String,
  })
  @Expose()
  @IsOptional()
  public fullname?: string;

  @ApiProperty({
    description: 'Avatar',
    type: String,
  })
  @Expose()
  @IsOptional()
  public avatar?: string;

  @ApiProperty({
    description: 'Email',
    type: String,
  })
  @Expose()
  @IsOptional()
  public email?: string;

  public constructor(data: Partial<UserDataShareDto>) {
    Object.assign(this, data);
  }
}

export class UserSharedDto extends UserDataShareDto {
  public groups?: string[];
}
