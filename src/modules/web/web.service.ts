import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WebRepository, repository } from './web.repository';
import { ProductDto } from './models/dto/product.dto';
import { SignInDto } from './models/dto/signIn.dto';
import { User } from './models/entities/user.entity';
import { Product } from './models/entities/product.entity';
import { Utils } from 'src/utils/utils';

@Injectable()
export class WebService {
  constructor(
    private readonly webRepository: WebRepository,
    private readonly utils: Utils,
  ) {}

  async signIn(info: SignInDto): Promise<User> {
    try {
      const user = await this.webRepository.getUserByUserAndPassword(info);
      return user;
    } catch (e) {
      throw new NotFoundException('Usuario não encontrado');
    }
  }

  async getUserKeys(user: number): Promise<object> {
    try {
      return await this.webRepository.getUserKeysByUserId(user);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async getObfuscatedUserKeys(user: number): Promise<object> {
    try {
      let response = await this.getUserKeys(user);
      const obfuscatedApiKey = this.obfuscateString(response['apiKey']);
      const obfuscatedCookie = this.obfuscateString(response['cookie']);
      return { apiKey: obfuscatedApiKey, cookie: obfuscatedCookie };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async getItems(user: number): Promise<ProductDto[]> {
    try {
      let response = await this.webRepository.getProductsByUserId(user);
      let result = [];
      response.forEach((element) => {
        result = [...result, new ProductDto(element, this.utils)];
      });

      return result;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async searchItem(search: string): Promise<object> {
    return repository.backRepo.filter((obj) => obj.sku.includes(search));
  }

  async addItems(body: ProductDto[], user: number): Promise<object> {
    try {
      const result = [];
      for (const element of body) {
        const product: Product = {
          id: null,
          sku: element.sku,
          price: this.utils.stringToFloat(element.price),
          isActive: element.isActive,
          user: user,
        };
        let status;
        try {
          if (this.isInvalidNumber(product.price))
            throw new UnprocessableEntityException();

          let response = await this.webRepository.saveProduct(product);
          status = { [element.sku]: `Success (Id: ${response.id})` };
        } catch (e) {
          status = { [element.sku]: `Error (${e.message})` };
        }
        result.push(status);
      }
      return result;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async updateItem(
    id: number,
    body: ProductDto,
    user: number,
  ): Promise<Product> {
    try {
      let product = await this.webRepository.getProductById(id, user);
      if (!product) throw new NotFoundException('Produto não encontrado');

      product.isActive = body.isActive;
      product.price = this.utils.stringToFloat(body.price);
      product.sku = body.sku;

      if (this.isInvalidNumber(product.price))
        throw new UnprocessableEntityException();

      return await this.webRepository.saveProduct(product);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async deleteItem(id: number, user: number): Promise<Product> {
    try {
      let product = await this.webRepository.getProductById(id, user);
      if (!product) throw new NotFoundException('Produto não encontrado');

      return await this.webRepository.removeProduct(product);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  private isInvalidNumber(number): boolean {
    return Number.isNaN(number) || !Number.isFinite(number) || !number;
  }

  private obfuscateString(str: string): string {
    const len = str.length;
    if (len <= 2) {
      return str;
    }
    const obfuscationChar = '*';
    const visibleChars = 2;
    const obfuscationCount = len - visibleChars;
    return (
      str.substr(0, visibleChars) + obfuscationChar.repeat(obfuscationCount)
    );
  }
}
