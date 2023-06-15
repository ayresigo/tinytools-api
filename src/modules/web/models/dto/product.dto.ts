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
}
