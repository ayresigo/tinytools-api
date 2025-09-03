import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import { WebRepository } from './web.repository';
import { ProductDto } from './models/dto/product.dto';
import { SignInDto } from './models/dto/signIn.dto';
import { User } from './models/entities/user.entity';
import { Product } from './models/entities/product.entity';
import { Utils } from 'src/utils/utils';
import { ApplicationFacade } from '../application/application.facade';
import { ApplicationService } from '../application/application.service';

@Injectable()
export class WebService {
  constructor(
    private readonly applicationFacade: ApplicationFacade,
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

  async updateApiKey(apiKey: string, user: number) {
    try {
      return await this.webRepository.updateApiKeyByUserId(user, apiKey);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async updateTinyAccount(username: string, password: string, user: number) {
    try {
      await this.applicationFacade.getTinyCookie(username, password); // Tenta logar na conta.
    } catch (e) {
      throw new UnauthorizedException(e.message);
    }

    try {
      return await this.webRepository.updateTinyAccountByUserId(
        user,
        username,
        password,
      );
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async getUserKeys(user: number): Promise<object> {
    try {
      let apiKey = await this.webRepository.getApiKeyByUserId(user);
      let tinyAccount = await this.webRepository.getTinyKeysByUserId(user);

      return {
        apiKey: apiKey['apiKey'],
        tinyLogin: tinyAccount['tinyLogin'],
        tinyPassword: tinyAccount['tinyPassword'],
      };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async getApiKey(user: number): Promise<object> {
    try {
      return await this.webRepository.getApiKeyByUserId(user);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async updateBotIsActive(isActive: boolean, id: number): Promise<object> {
    try {
      var user = await this.webRepository.getUserById(id);
      user.botIsActive = isActive;

      return await this.webRepository.saveUser(user);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async getObfuscatedUserKeys(user: number): Promise<object> {
    try {
      let response = await this.getUserKeys(user);
      const obfuscatedApiKey = this.obfuscateString(response['apiKey'], 5);
      // const obfuscatedLogin = this.obfuscateString(response['tinyLogin']);
      const obfuscatedLogin = response['tinyLogin'];
      const obfuscatedPassword = this.obfuscateString(response['tinyPassword']);
      return {
        apiKey: obfuscatedApiKey,
        tinyLogin: obfuscatedLogin,
        tinyPassword: obfuscatedPassword,
      };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async getItems(user: number): Promise<ProductDto[]> {
    try {
      // console.log('Getting items for user -', user);
      // console.log(user);
      const response = await this.webRepository.getProductsByUserId(user);
      let result = [];
      response.forEach((element) => {
        result = [...result, new ProductDto(element, this.utils)];
      });

      return result;
    } catch (e) {
      console.log(e.message, 'getItems error');
      throw new BadRequestException(e.message);
    }
  }

  async getIsActive(user: number): Promise<object> {
    try {
      return await this.webRepository.getBotIsActiveById(user);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
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
          aliPrice: this.utils.stringToFloat(element.price),
          aliActive: element.isActive,
          mercadoPrice: this.utils.stringToFloat(element.price),
          mercadoActive: false,
          sheinPrice: this.utils.stringToFloat(element.price),
          sheinActive: element.isActive,
          shopeePrice: this.utils.stringToFloat(element.price),
          shopeeActive: element.isActive,
          tiktokPrice: this.utils.stringToFloat(element.price),
          tiktokActive: element.isActive,
          user: user,
        };
        let status;
        try {
          if (this.isInvalidNumber(product.price))
            throw new UnprocessableEntityException();

          const response = await this.webRepository.saveProduct(product);
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
      const product = await this.webRepository.getProductById(id, user);
      if (!product) throw new NotFoundException('Produto não encontrado');

      product.isActive = body.isActive;
      product.price = this.utils.stringToFloat(body.price);
      product.mercadoActive = body.mercadoActive;
      product.mercadoPrice = this.utils.stringToFloat(body.mercadoPrice);
      product.sheinActive = body.sheinActive;
      product.sheinPrice = this.utils.stringToFloat(body.sheinPrice);
      product.aliActive = body.aliActive;
      product.aliPrice = this.utils.stringToFloat(body.aliPrice);
      product.shopeeActive = body.shopeeActive;
      product.shopeePrice = this.utils.stringToFloat(body.shopeePrice);
      product.tiktokActive = body.tiktokActive;
      product.tiktokPrice = this.utils.stringToFloat(body.tiktokPrice);
      product.sku = body.sku;

      // console.log('here');

      if (
        this.isInvalidNumber(product.price) ||
        this.isInvalidNumber(product.mercadoPrice) ||
        this.isInvalidNumber(product.sheinPrice) ||
        this.isInvalidNumber(product.aliPrice) ||
        this.isInvalidNumber(product.shopeePrice) ||
        this.isInvalidNumber(product.tiktokPrice)
      ) {
        throw new UnprocessableEntityException();
      }
      return await this.webRepository.saveProduct(product);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async deleteItem(id: number, user: number): Promise<Product> {
    try {
      const product = await this.webRepository.getProductById(id, user);
      if (!product) throw new NotFoundException('Produto não encontrado');

      return await this.webRepository.removeProduct(product);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  private isInvalidNumber(number): boolean {
    return Number.isNaN(number) || !Number.isFinite(number);
  }

  private obfuscateString(str: string, qtd = 0): string {
    const len = str.length;
    if (len <= qtd) {
      return str;
    }
    const obfuscationChar = '*';
    const visibleChars = qtd;
    const obfuscationCount = len - visibleChars;
    return (
      str.substr(0, visibleChars) + obfuscationChar.repeat(obfuscationCount)
    );
  }
}
