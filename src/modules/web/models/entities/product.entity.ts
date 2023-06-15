import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { IsNumber } from 'class-validator';

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

  @Column({ name: 'fk_users_id', type: 'integer' })
  user: number;
}
