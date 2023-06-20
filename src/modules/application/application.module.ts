import { Module } from '@nestjs/common';

import { ApplicationFacade } from './application.facade';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { WebService } from '../web/web.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../web/models/entities/user.entity';
import { Utils } from 'src/utils/utils';
import { WebRepository } from '../web/web.repository';
import { Product } from '../web/models/entities/product.entity';
import { WebModule } from '../web/web.module';

@Module({
  imports: [
    WebModule,
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Product]),
  ],
  providers: [
    ApplicationFacade,
    ApplicationService,
    WebRepository,
    WebService,
    Utils,
  ],
  controllers: [ApplicationController],
  exports: [ApplicationFacade],
})
export class ApplicationModule {}
