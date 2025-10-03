import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class Utils {
  floatToString(number: number): string {
    try {
      if (Number.isInteger(number))
        return number.toString().replace('.', ',') + ',00';
      else
        return (Math.floor(number * 100) / 100)
          .toFixed(2)
          .toString()
          .replace('.', ',');
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  stringToFloat(string: string): number {
    try {
      const result = parseFloat(string.replace(',', '.'));
      return result;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
