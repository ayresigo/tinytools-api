import { Module } from '@nestjs/common';
import { WebService } from './web.service';
import { WebController } from './web.controller';
import { WebRepository } from './web.repository';
import { Utils } from 'src/utils/utils';
import { SharedModule } from '../application/shared.module';
import { EntitiesModule } from './typeorm.module';

@Module({
  imports: [
    SharedModule,
    EntitiesModule,
  ],
  providers: [WebService, WebRepository, Utils],
  controllers: [WebController],
  exports: [WebService, WebRepository, Utils],
})
export class WebModule {}
