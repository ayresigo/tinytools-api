import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  username!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'integer' })
  role: number;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  apiKey: string;

  @Column({ type: 'varchar' })
  cookie: string;
}
