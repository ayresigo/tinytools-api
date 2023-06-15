import { Module } from '@nestjs/common';

import { ApplicationFacade } from './application.facade';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';

@Module({
  imports: [],
  providers: [ApplicationFacade, ApplicationService],
  controllers: [ApplicationController],
  exports: [ApplicationFacade],
})
export class ApplicationModule {}
