import { ApiProperty } from '@nestjs/swagger';

export class ReceivedWebhookDto {
  @ApiProperty()
  search: string;
}
