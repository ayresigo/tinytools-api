import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { WebModule } from '../web/web.module';
import { SharedModule } from './shared.module';
import { EntitiesModule } from '../web/typeorm.module';

@Module({
  imports: [SharedModule, WebModule, EntitiesModule],
  controllers: [ApplicationController],
})
export class ApplicationModule {}