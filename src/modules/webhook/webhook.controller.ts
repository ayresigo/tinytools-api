import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { CookieGuard } from '../auth/cookie.guard';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(200)
  async receiveWebhook(@Request() req, @Body() body: object) {
    return this.webhookService.receiveWebhook(body, req.cookie, req.apiKey);
  }

  @HttpCode(200)
  @Post('goldtech')
  async receiveGoldtechWebhook(@Body() body: object) {
    return this.webhookService.receiveGoldtech(body);
  }

  @HttpCode(200)
  @Get('strt_rtn')
  async start_routine(@Query('id') id: string) {
    return this.webhookService.testWebhook(id);
  }

  @Post('startRoutine')
  async startRoutine(@Request() req, @Query('id') id: string) {
    return await this.webhookService.startRoutine(id, req.cookie, req.apiKey);
  }
}
