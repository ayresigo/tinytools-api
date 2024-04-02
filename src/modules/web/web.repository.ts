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

  async getTinyKeysByUserId(id: number): Promise<object> {
    return await this.userRepository.findOne({
      select: {
        tinyLogin: true,
        tinyPassword: true,
      },
      where: {
        id: id,
      },
    });
  }

  async getApiKeyByUserId(id: number): Promise<object> {
    return await this.userRepository.findOne({
      select: {
        apiKey: true,
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

  async getApiKeyAndIdByName(name: string): Promise<object> {
    return await this.userRepository.findOne({
      select: {
        id: true,
        apiKey: true,
      },
      where: {
        name: name,
      },
    });
  }

  async updateApiKeyByUserId(id: number, apiKey: string): Promise<object> {
    return await this.userRepository.save({ id: id, apiKey: apiKey });
  }

  async updateTinyAccountByUserId(
    id: number,
    username: string,
    password: string,
  ): Promise<object> {
    return await this.userRepository.save({
      id: id,
      tinyLogin: username,
      tinyPassword: password,
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

  async getProductsByUserId(id: number, store: string): Promise<Product[]> {
    if (!store) {
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
    return await this.productsRepository.find({
      select: {
        id: true,
        isActive: true,
        sku: true,
        price: true,
      },
      where: {
        user: id,
        store: store,
      },
      order: {
        id: {
          direction: 'asc',
        },
      },
    });
  }

  async getProductById(id: number, user: number, store: string) {
    return await this.productsRepository.findOne({
      where: {
        user: user,
        id: id,
        store: store,
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
