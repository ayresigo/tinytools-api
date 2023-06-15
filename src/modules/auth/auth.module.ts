import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';

import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { WebModule } from '../web/web.module';
import { jwtConstants } from './constants';
import { WebRepository } from '../web/web.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../web/models/entities/user.entity';
import { Product } from '../web/models/entities/product.entity';
import { WebService } from '../web/web.service';
import { Utils } from 'src/utils/utils';

@Module({
  imports: [
    WebModule,
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Product]),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiration },
    }),
  ],
  providers: [AuthService, WebService, WebRepository, Utils],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
