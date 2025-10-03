import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';

import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { WebModule } from '../web/web.module';
import { jwtConstants } from './constants';
import { SharedModule } from '../application/shared.module';
import { EntitiesModule } from '../web/typeorm.module';

@Module({
  imports: [
    WebModule,
    SharedModule,
    EntitiesModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiration },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
