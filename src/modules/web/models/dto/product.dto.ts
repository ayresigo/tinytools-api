import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Product } from '../entities/product.entity';
import { Utils } from 'src/utils/utils';

export class ProductDto {
  constructor(object: Product, utils: Utils) {
    if (object && utils) {
      this.id = object.id;
      this.sku = object.sku;
      this.price = utils.floatToString(object.price);
      this.mercadoPrice = utils.floatToString(object.mercadoPrice);
      this.mercadoActive = object.mercadoActive;
      this.sheinPrice = utils.floatToString(object.sheinPrice);
      this.sheinActive = object.sheinActive;
      this.aliPrice = utils.floatToString(object.aliPrice);
      this.aliActive = object.aliActive;
      this.shopeePrice = utils.floatToString(object.shopeePrice);
      this.shopeeActive = object.shopeeActive;
      this.tiktokPrice = utils.floatToString(object.tiktokPrice);
      this.tiktokActive = object.tiktokActive;

      // this.store = object.store;
      this.isActive = object.isActive;
    }
  }

  id?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  price: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  mercadoPrice: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  mercadoActive: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sheinPrice: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  sheinActive: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  aliPrice: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  aliActive: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  shopeePrice: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  shopeeActive: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tiktokPrice: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  tiktokActive: boolean;
}
