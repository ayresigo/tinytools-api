import { Module } from '@nestjs/common';
import { ApplicationFacade } from '../application/application.facade';
import { ApplicationService } from './application.service';
import { WebRepository } from '../web/web.repository';
import { EntitiesModule } from '../web/typeorm.module';

@Module({
  imports: [EntitiesModule],
  providers: [ApplicationFacade, ApplicationService, WebRepository],
  exports: [ApplicationFacade],
})
export class SharedModule {}