import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @HttpCode(200)
  @Post('goldtech')
  async receiveGoldtechWebhook(@Body() body: object) {
    var response = await this.webhookService.receiveCustomWebhook(body, 'goldtech');
    console.log(response);
    return response;
  }

  @HttpCode(200)
  @Post('megatech')
  async receiveMegatechWebhook(@Body() body: object) {
    var response = await this.webhookService.receiveCustomWebhook(body, 'megatech');
    console.log(response);
    return response;
  }

  @HttpCode(200)
  @Get('startRoutine')
  async start_routine(@Query('id') id: string) {
    var response = await this.webhookService.testWebhook(id);
    console.log(response);
    return response;
  }
}
