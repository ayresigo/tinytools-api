import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    const host = this.config.get<string>('DATABASE_HOST');
    const port = this.config.get<number>('DATABASE_PORT');
    const database = this.config.get<string>('DATABASE_NAME');
    const username = this.config.get<string>('DATABASE_USER');
    
    console.log('Database config:', { host, port, database, username });
    
    return {
      type: 'postgres',
      host,
      port,
      database,
      username,
      password: this.config.get<string>('DATABASE_PASSWORD'),
      entities: ['dist/**/*.entity.{ts,js}'],
      migrations: ['dist/migrations/*.{ts,js}'],
      migrationsTableName: 'typeorm_migrations',
      logger: 'file',
      // synchronize: true, // never use TRUE in production!
    };
  }
}