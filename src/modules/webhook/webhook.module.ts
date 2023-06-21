import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { ApplicationModule } from '../application/application.module';
import { SharedModule } from '../application/shared.module';
import { WebModule } from '../web/web.module';
import { EntitiesModule } from '../web/typeorm.module';

@Module({
  imports: [
    WebModule,
    ApplicationModule,
    SharedModule,
    EntitiesModule,
  ],
  providers: [WebhookService],
  controllers: [WebhookController],
})
export class WebhookModule {}
