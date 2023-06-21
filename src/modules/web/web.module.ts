import { Module } from '@nestjs/common';
import { WebService } from './web.service';
import { WebController } from './web.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebRepository } from './web.repository';
import { User } from './models/entities/user.entity';
import { Product } from './models/entities/product.entity';
import { Utils } from 'src/utils/utils';


@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Product]),
  ],
  providers: [WebService, WebRepository, Utils],
  controllers: [WebController],
})
export class WebModule {}
