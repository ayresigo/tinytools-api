import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { constants } from 'src/utils/constants';
import { AddInvoiceDto } from './models/addInvoice.dto';
import { WebRepository } from '../web/web.repository';

@Injectable()
export class ApplicationFacade {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly webRepository: WebRepository,
  ) {}

  receiveApplication(data): string {
    return 'received';
  }

  async searchProduct(apiKey: string, search: string): Promise<object> {
    const params = {
      pesquisa: search,
    };

    const response = await this.applicationService.sendARequest(
      'produtos.pesquisa.php',
      params,
      apiKey,
    );

    const products = response.retorno.produtos;
    const regex = new RegExp(search, 'i');

    for (let i = 0; i < products.length; i++) {
      if (regex.test(products[i].produto.codigo)) {
        return products[i].produto;
      }
    }

    throw new BadRequestException('Sku não encontrado');
  }

  async searchInvoice(cookie: string, id: string): Promise<object> {
    console.log('Searching invoice -', id);
    const response = await this.applicationService.sendBRequest(
      {
        func: constants.GET_INVOICE_FUNC,
        invoiceId: id,
      },
      cookie,
      constants.SCRAPED_INVOICE_ENDPOINT,
    );

    const result = this.mapObject(response, constants.INVOICE_ITEM_PREFIX);

    if (Object.keys(result).length == 1)
      throw new NotFoundException(result['message']);

    return result;
  }

  async getTempItem(
    cookie: string,
    id: string,
    itemId: string,
  ): Promise<object> {
    console.log('Getting item -', id);
    const response = await this.applicationService.sendBRequest(
      {
        func: constants.GET_TEMP_ITEM_FUNC,
        invoiceId: id,
        itemId: itemId,
      },
      cookie,
      constants.SCRAPED_INVOICE_ENDPOINT,
    );

    return this.mapObject(response, constants.TEMP_ITEM_PREFIX);
  }

  async addTempItem(
    cookie: string,
    id: string,
    itemId: string,
    tempInvoiceId: string,
    newPrice: string,
    tempItem: object,
  ): Promise<object> {
    tempItem['base_comissao'] = newPrice;
    tempItem['valorUnitario'] = newPrice;
    tempItem['valorTotal'] = this.getTotalPrice(
      newPrice,
      tempItem['quantidade'],
      'multiply',
    );

    console.log('Adding temp item -', id);

    const response = await this.applicationService.sendBRequest(
      {
        func: constants.ADD_TEMP_ITEM_FUNC,
        invoiceId: id,
        itemId: itemId,
        tempInvoiceId: tempInvoiceId,
        tempItem: tempItem,
      },
      cookie,
      constants.SCRAPED_INVOICE_ENDPOINT,
    );

    return this.mapObject(response, constants.SENT_TEMP_ITEM_PREFIX);
  }

  async addInvoice(
    cookie: string,
    id: string,
    invoice: AddInvoiceDto,
  ): Promise<object> {
    console.log('Adding temp item -', id);
    const taxes = await this.calcTax(cookie, id, invoice.idNotaTmp);

    invoice.desconto = '0,00';
    invoice.valorDesconto = '0,00';
    invoice.valorProdutos = taxes['valorProdutos'];
    invoice.totalFaturado = taxes['valorProdutos'];
    invoice.valorNota = taxes['valorProdutos'];
    invoice.valorAproximadoImpostosTotal =
      taxes['valorAproximadoImpostosTotal'];
    invoice.obsSistema = taxes['obsSistema'];

    const response = await this.applicationService.sendBRequest(
      {
        func: constants.ADD_INVOICE_FUNC,
        invoiceId: id,
        invoice: invoice,
      },
      cookie,
      constants.SCRAPED_INVOICE_ENDPOINT,
    );

    return this.mapObject(response, constants.ADD_INVOICE_FUNC);
  }

  async sendInvoice(
    apiKey: string,
    invoiceId: number,
    sendEmail: string,
  ): Promise<object> {
    console.log('Sending invoice -', invoiceId);
    const response = await this.applicationService.sendARequest(
      constants.PROVIDED_SEND_INVOICE_ENDPOINT,
      { id: invoiceId, enviarEmail: sendEmail },
      apiKey,
    );

    return response.data;
  }

  async getTinyCookieById(id: number): Promise<object> {
    console.log('Getting tinyCookieById');
    const keys = await this.webRepository.getTinyKeysByUserId(id);

    if (!keys)
      throw new UnauthorizedException(
        'O nome de usuário e a senha não correspondem',
      );

    return await this.getTinyCookie(keys['tinyLogin'], keys['tinyPassword']);
  }

  async getTinyCookie(login: string, password: string): Promise<object> {
    console.log('Starting to get tiny cookie');
    const cookie = 'dummy';

    const aLogin = await this.applicationService.sendXRequest({
      login,
      password,
    });

    const { dynamicUrl, setCookieResponse } = aLogin;

    const bLogin = await this.applicationService.sendYRequest(
      dynamicUrl,
      login,
      password,
      setCookieResponse,
    );

    const { tinyCookie, code } = bLogin;

    const eLogin = await this.applicationService.sendBRequest(
      {
        metd: constants.E_LOGIN_FUNC_METD,
        login,
        password,
        code,
      },
      cookie,
      constants.SCRAPED_LOGIN_ENDPOINT,
    );

    const eResponse = this.mapObject(eLogin, null);

    if ('error' in eResponse)
      throw new UnauthorizedException(
        'O nome de usuário e a senha não correspondem',
      );

    await this.applicationService.sendBRequest(
      {
        metd: constants.F_LOGIN_FUNC_METD,
        uidLogin: eResponse['response']['uidLogin'],
        idUsuario: eResponse['response']['idUsuario'],
      },
      cookie,
      constants.SCRAPED_LOGIN_ENDPOINT,
    );

    return tinyCookie;
  }

  async calcTax(
    cookie: string,
    id: string,
    tempInvoiceId: string,
  ): Promise<object> {
    console.log('Calculating taxes -', id);
    const response = await this.applicationService.sendBRequest(
      {
        func: constants.CALC_TAXES_FUNC,
        invoiceId: id,
        tempInvoiceId: tempInvoiceId,
      },
      cookie,
      constants.SCRAPED_INVOICE_ENDPOINT,
    );

    return this.mapObject(response, null);
  }

  private getTotalPrice(
    firstElement: string,
    secondElement: string,
    operator: string,
  ) {
    const _firstElement = parseFloat(firstElement.replace(',', '.'));
    const _secondElement = parseFloat(secondElement.replace(',', '.'));
    let _result = 0;
    switch (operator) {
      case 'multiply':
        _result = _firstElement * _secondElement;
        break;
      case 'sum':
        _result = _firstElement + _secondElement;
        break;
      case 'divide':
        _result = _firstElement / _secondElement;
    }
    return _result.toFixed(2).toString().replace('.', ',');
  }

  //adicionar um try catch e uns throws aqui
  private mapObject(object: object, prefix: string) {
    const props = object['response'];
    let result = {};
    props.forEach((element) => {
      if (element['cmd'] == 'as') result[element['elm']] = element['val'];
      else if (element['cmd'] == 'sc' && element['src'].includes(prefix)) {
        if (prefix == constants.INVOICE_ITEM_PREFIX) {
          result['itemsArray'] = this.parseNestedArray(element['src']);
        } else if (
          prefix == constants.TEMP_ITEM_PREFIX ||
          prefix == constants.SENT_TEMP_ITEM_PREFIX
        ) {
          const parsedSrc = this.parseNestedBraces(element['src']);
          const parsedObj = JSON.parse(
            unescape(parsedSrc[parsedSrc.length - 1]),
          );
          result = parsedObj;
        }
      } else if (element['cmd'] == 'rt') result['response'] = element['val'];
      else if (element['cmd'] == 'rj') result['error'] = element['exc'];
    });

    return result;
  }

  private parseNestedArray(text) {
    const regex = /\[.*?\]/;
    const match = text.match(regex);

    const vetorString = match[0];
    const vetor = JSON.parse(vetorString);
    return vetor;
  }

  private parseNestedBraces(text) {
    const stack = [];
    const matches = [];

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        stack.push(i);
      } else if (text[i] === '}') {
        if (stack.length > 0) {
          const startIndex = stack.pop();
          const endIndex = i;
          const match = text.substring(startIndex, endIndex + 1);
          matches.push(match);
        }
      }
    }

    return matches;
  }
}
