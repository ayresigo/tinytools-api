import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './models/entities/user.entity';
import { Product } from './models/entities/product.entity';
import { SignInDto } from './models/dto/signIn.dto';

@Injectable()
export class WebRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async getUserKeysByUserId(id: number): Promise<object> {
    return await this.userRepository.findOne({
      select: {
        apiKey: true,
        cookie: true,
      },
      where: {
        id: id,
      },
    });
  }

  async getBotIsActiveByName(name: string): Promise<object> {
    return await this.userRepository.findOne({
      select: {
        botIsActive: true,
      },
      where: {
        name: name,
      },
    });
  }

  async getBotIsActiveById(id: number): Promise<object> {
    return await this.userRepository.findOne({
      select: {
        botIsActive: true,
      },
      where: {
        id: id,
      },
    });
  }

  async getUserKeysByName(name: string): Promise<object> {
    return await this.userRepository.findOne({
      select: {
        id: true,
        apiKey: true,
        cookie: true,
      },
      where: {
        name: name,
      },
    });
  }

  async getUserByUserAndPassword(info: SignInDto): Promise<User> {
    return await this.userRepository.findOneOrFail({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        botIsActive: true,
      },
      where: {
        username: info.username,
        password: info.password,
      },
    });
  }

  async getUserById(id: number): Promise<User> {
    return await this.userRepository.findOne({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        botIsActive: true,
      },
      where: {
        id: id,
      },
    });
  }

  async getProductsByUserId(id: number): Promise<Product[]> {
    return await this.productsRepository.find({
      select: {
        id: true,
        isActive: true,
        sku: true,
        price: true,
      },
      where: {
        user: id,
      },
      order: {
        id: {
          direction: 'asc',
        },
      },
    });
  }

  async getProductById(id: number, user: number) {
    return await this.productsRepository.findOne({
      where: {
        user: user,
        id: id,
      },
    });
  }

  async saveUser(user: User) {
    return await this.userRepository.save(user);
  }

  async saveProduct(product: Product) {
    return await this.productsRepository.save(product);
  }

  async removeProduct(product: Product) {
    return await this.productsRepository.remove(product);
  }
}
