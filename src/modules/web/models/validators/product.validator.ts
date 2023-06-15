import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { getRepository } from 'typeorm';
import { Product } from '../entities/product.entity';

@ValidatorConstraint({ name: 'isValidPrice', async: false })
class IsValidPrice implements ValidatorConstraintInterface {
  validate(price: number, args: ValidationArguments) {
    return !isNaN(price);
  }

  defaultMessage(args: ValidationArguments) {
    return 'O preço deve ser um número válido';
  }
}

export class ProductValidator {
  /**
   * Validates if the given product data is correct.
   * @returns Promise that resolves if the data is valid, or rejects with the validation error message.
   */
  static async validate(data: Product): Promise<void> {
    const { price } = data;
    const args: ValidationArguments = {
      value: price,
      targetName: Product.name,
      object: data,
      property: 'price',
      constraints: [],
    };
    const isValid = await new IsValidPrice().validate(price, args);
    if (!isValid) {
      throw new Error('O preço deve ser um número válido');
    }
  }
}
