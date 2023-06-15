import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { constants } from 'src/utils/constants';
import { AddInvoiceDto } from './models/addInvoice.dto';

@Injectable()
export class ApplicationFacade {
  constructor(private readonly applicationService: ApplicationService) {}

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
    const response = await this.applicationService.sendBRequest(
      {
        func: constants.GET_INVOICE_FUNC,
        invoiceId: id,
      },
      cookie,
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
    const response = await this.applicationService.sendBRequest(
      {
        func: constants.GET_TEMP_ITEM_FUNC,
        invoiceId: id,
        itemId: itemId,
      },
      cookie,
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

    const response = await this.applicationService.sendBRequest(
      {
        func: constants.ADD_TEMP_ITEM_FUNC,
        invoiceId: id,
        itemId: itemId,
        tempInvoiceId: tempInvoiceId,
        tempItem: tempItem,
      },
      cookie,
    );

    return this.mapObject(response, constants.SENT_TEMP_ITEM_PREFIX);
  }

  async addInvoice(
    cookie: string,
    id: string,
    invoice: AddInvoiceDto,
  ): Promise<object> {
    const taxes = await this.calcTax(cookie, id, invoice.idNotaTmp);

    invoice.desconto = '0,00';
    invoice.valorDesconto = '0,00';
    invoice.valorProdutos = taxes['valorProdutos'];
    invoice.totalFaturado = taxes['valorProdutos'];
    invoice.valorNota = taxes['valorProdutos'];
    invoice.valorAproximadoImpostosTotal =
      taxes['valorAproximadoImpostosTotal'];
    invoice.obsSistema = taxes['obsSistema'];

    // console.log(JSON.stringify(invoice));

    const response = await this.applicationService.sendBRequest(
      {
        func: constants.ADD_INVOICE_FUNC,
        invoiceId: id,
        invoice: invoice,
      },
      cookie,
    );

    return this.mapObject(response, constants.ADD_INVOICE_FUNC);
  }

  async sendInvoice(
    apiKey: string,
    invoiceId: number,
    sendEmail: string,
  ): Promise<object> {
    const response = await this.applicationService.sendARequest(
      constants.PROVIDED_SEND_INVOICE_ENDPOINT,
      { id: invoiceId, enviarEmail: sendEmail },
      apiKey,
    );

    return response.data;
  }

  async calcTax(
    cookie: string,
    id: string,
    tempInvoiceId: string,
  ): Promise<object> {
    const response = await this.applicationService.sendBRequest(
      {
        func: constants.CALC_TAXES_FUNC,
        invoiceId: id,
        tempInvoiceId: tempInvoiceId,
      },
      cookie,
    );

    return this.mapObject(response, null);
  }

  private getTotalPrice(
    firstElement: string,
    secondElement: string,
    operator: string,
  ) {
    let _firstElement = parseFloat(firstElement.replace(',', '.'));
    let _secondElement = parseFloat(secondElement.replace(',', '.'));
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
    let props = object['response'];
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
          let parsedSrc = this.parseNestedBraces(element['src']);
          let parsedObj = JSON.parse(unescape(parsedSrc[parsedSrc.length - 1]));
          result = parsedObj;
        }
      }
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
    let stack = [];
    let matches = [];

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        stack.push(i);
      } else if (text[i] === '}') {
        if (stack.length > 0) {
          let startIndex = stack.pop();
          let endIndex = i;
          let match = text.substring(startIndex, endIndex + 1);
          matches.push(match);
        }
      }
    }

    return matches;
  }
}
