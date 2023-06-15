import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ApplicationModule } from './modules/application/application.module';
import { WebModule } from './modules/web/web.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import * as cors from 'cors';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from './config/config.service';
import { getEnvPath } from './envs/env.helper';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmConfigService } from './database/database.providers';
import { AuthModule } from './modules/auth/auth.module';

const envFilePath: string = getEnvPath(`${__dirname}/envs`);
@Module({
  imports: [
    AuthModule,
    ApplicationModule,
    WebModule,
    WebhookModule,
    ConfigModule.forRoot({ envFilePath, isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cors()).forRoutes('*');
  }
}
