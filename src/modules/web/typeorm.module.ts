import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './models/entities/user.entity';
import { Product } from './models/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Product]),
  ],
  exports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Product]),
  ],
})
export class EntitiesModule {}
