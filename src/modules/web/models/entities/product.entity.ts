import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { IsNumber, IsString, isNumber } from 'class-validator';

@Entity({ name: 'products' })
@Unique(['user', 'sku'])
export class Product {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'sku', type: 'text' })
  sku!: string;

  @Column({ name: 'price', type: 'float' })
  @IsNumber()
  price!: number;

  @Column({ name: 'isActive', type: 'boolean' })
  isActive: boolean;

  @Column({ name: 'mercado_price', type: 'float' })
  @IsNumber()
  mercadoPrice: number;

  @Column({ name: 'mercado_active', type: 'boolean' })
  mercadoActive: boolean;

  @Column({ name: 'ali_price', type: 'float' })
  @IsNumber()
  aliPrice: number;

  @Column({ name: 'ali_active', type: 'boolean' })
  aliActive: boolean;

  @Column({ name: 'shein_price', type: 'float' })
  @IsNumber()
  sheinPrice: number;

  @Column({ name: 'shein_active', type: 'boolean' })
  sheinActive: boolean;

  @Column({ name: 'shopee_price', type: 'float' })
  @IsNumber()
  shopeePrice: number;

  @Column({ name: 'shopee_active', type: 'boolean' })
  shopeeActive: boolean;

  @Column({ name: 'fk_users_id', type: 'integer' })
  user: number;
}
