import { ApiProperty } from '@nestjs/swagger';

export class UserKeysDto {
  constructor(object) {
    this.userId = object.id;
    this.cookie = object.cookie;
    this.apiKey = object.apiKey;
  }
  @ApiProperty()
  userId: number;
  @ApiProperty()
  cookie: string;
  @ApiProperty()
  apiKey: string;
}
