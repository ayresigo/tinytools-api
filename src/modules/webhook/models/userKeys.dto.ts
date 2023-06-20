import { ApiProperty } from '@nestjs/swagger';

export class UserKeysDto {
  constructor(object) {
    this.userId = object.id;
    this.apiKey = object.apiKey;
  }

  @ApiProperty()
  userId: number;

  @ApiProperty()
  apiKey: string;
}
