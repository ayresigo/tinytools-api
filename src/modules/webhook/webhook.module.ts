import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { ApplicationModule } from '../application/application.module';
import { WebRepository } from '../web/web.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../web/models/entities/user.entity';
import { Product } from '../web/models/entities/product.entity';
import { WebService } from '../web/web.service';
import { Utils } from 'src/utils/utils';

@Module({
  imports: [
    ApplicationModule,
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Product]),
  ],
  providers: [WebhookService, WebRepository, WebService, Utils],
  controllers: [WebhookController],
})
export class WebhookModule {}
