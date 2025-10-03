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

  async searchInvoice(id: string): Promise<object> {
    // console.log('Searching invoice -', id);
    const response = await this.applicationService.sendBRequest(
      {
        func: constants.GET_INVOICE_FUNC,
        invoiceId: id,
      },
      constants.SCRAPED_INVOICE_ENDPOINT,
    );

    const result = this.mapObject(response, constants.INVOICE_ITEM_PREFIX);

    // console.log(response);

    if (response.response[0].src.includes('Sua sessão expirou')) {
      throw new UnauthorizedException('invalid cookie');
    }

    if (Object.keys(result).length == 1)
      throw new NotFoundException(result['message']);

    return result;
  }

  async getTempItem(id: string, itemId: string): Promise<object> {
    // console.log('Getting item -', id);
    const response = await this.applicationService.sendBRequest(
      {
        func: constants.GET_TEMP_ITEM_FUNC,
        invoiceId: id,
        itemId: itemId,
      },
      constants.SCRAPED_INVOICE_ENDPOINT,
    );

    return this.mapObject(response, constants.TEMP_ITEM_PREFIX);
  }

  async addTempItem(
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

    // console.log('Adding temp item -', id);

    const response = await this.applicationService.sendBRequest(
      {
        func: constants.ADD_TEMP_ITEM_FUNC,
        invoiceId: id,
        itemId: itemId,
        tempInvoiceId: tempInvoiceId,
        tempItem: tempItem,
      },
      constants.SCRAPED_INVOICE_ENDPOINT,
    );

    return this.mapObject(response, constants.SENT_TEMP_ITEM_PREFIX);
  }

  async addInvoice(id: string, invoice: AddInvoiceDto): Promise<object> {
    // console.log('Adding temp item -', id);

    // Calculate taxes with error handling
    let taxes;
    try {
      taxes = await this.calcTax(id, invoice.idNotaTmp);
      if (!taxes) {
        throw new Error('Tax calculation returned null or undefined');
      }
    } catch (error) {
      console.error('Tax calculation failed:', error.message);
      // Continue with default values if tax calculation fails
      taxes = {
        valorProdutos: invoice.valorProdutos || '0,00',
        valorAproximadoImpostosTotal: '0,00',
        obsSistema: ''
      };
    }

    invoice.desconto = '0,00';
    invoice.valorDesconto = '0,00';
    invoice.valorProdutos = taxes.valorProdutos || '0,00';
    invoice.totalFaturado = taxes.valorProdutos || '0,00';
    invoice.valorNota = taxes.valorProdutos || '0,00';
    invoice.valorAproximadoImpostosTotal = taxes.valorAproximadoImpostosTotal || '0,00';
    invoice.obsSistema = taxes.obsSistema || '';

    // Update ICMS fields from tax calculation if available
    if (taxes.valorICMS) invoice.valorICMS = taxes.valorICMS;
    if (taxes.baseICMS) invoice.baseICMS = taxes.baseICMS;
    if (taxes.valorTotalFCP) invoice.valorTotalFCP = taxes.valorTotalFCP;
    if (taxes.valorTotalICMSFCPDestino) invoice.valorTotalICMSFCPDestino = taxes.valorTotalICMSFCPDestino;
    if (taxes.percentualICMSFCPDestino) invoice.percentualICMSFCPDestino = taxes.percentualICMSFCPDestino;
    if (taxes.valorTotalICMSPartilhaDestino) invoice.valorTotalICMSPartilhaDestino = taxes.valorTotalICMSPartilhaDestino;
    if (taxes.valorTotalICMSPartilhaOrigem) invoice.valorTotalICMSPartilhaOrigem = taxes.valorTotalICMSPartilhaOrigem;
    if (taxes.percentualICMSPartilhaDestino) invoice.percentualICMSPartilhaDestino = taxes.percentualICMSPartilhaDestino;

    try {
      console.log('About to save invoice with these ICMS values:', {
        valorProdutos: invoice.valorProdutos,
        baseICMS: invoice.baseICMS,
        valorICMS: invoice.valorICMS,
        valorTotalFCP: invoice.valorTotalFCP,
        valorTotalICMSFCPDestino: invoice.valorTotalICMSFCPDestino,
        percentualICMSFCPDestino: invoice.percentualICMSFCPDestino,
        valorTotalICMSPartilhaDestino: invoice.valorTotalICMSPartilhaDestino,
        valorTotalICMSPartilhaOrigem: invoice.valorTotalICMSPartilhaOrigem,
        percentualICMSPartilhaDestino: invoice.percentualICMSPartilhaDestino,
        valorNota: invoice.valorNota,
      });

      const response = await this.applicationService.sendBRequest(
        {
          func: constants.ADD_INVOICE_FUNC,
          invoiceId: id,
          invoice: invoice,
        },
        constants.SCRAPED_INVOICE_ENDPOINT,
      );

      const result = this.mapObject(response, constants.ADD_INVOICE_FUNC);
      console.log('Invoice saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Invoice save failed:', error.message);
      console.error('Invoice data that failed to save:', {
        valorProdutos: invoice.valorProdutos,
        baseICMS: invoice.baseICMS,
        valorICMS: invoice.valorICMS,
        valorTotalFCP: invoice.valorTotalFCP,
        valorTotalICMSFCPDestino: invoice.valorTotalICMSFCPDestino,
        percentualICMSFCPDestino: invoice.percentualICMSFCPDestino,
        valorTotalICMSPartilhaDestino: invoice.valorTotalICMSPartilhaDestino,
        valorTotalICMSPartilhaOrigem: invoice.valorTotalICMSPartilhaOrigem,
        percentualICMSPartilhaDestino: invoice.percentualICMSPartilhaDestino,
      });
      throw new BadRequestException(`Failed to save invoice: ${error.message}`);
    }
  }

  async sendInvoice(
    apiKey: string,
    invoiceId: number,
    sendEmail: string,
  ): Promise<object> {
    console.log('Sending invoice -', invoiceId);

    let response;
    try {
      response = await this.applicationService.sendARequest(
        constants.PROVIDED_SEND_INVOICE_ENDPOINT,
        { id: invoiceId, enviarEmail: sendEmail },
        apiKey,
      );

      return response.data;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async getTinyCookieById(id: number): Promise<object> {
    // console.log('Getting tinyCookieById');
    const keys = await this.webRepository.getTinyKeysByUserId(id);

    if (!keys)
      throw new UnauthorizedException(
        'O nome de usuário e a senha não correspondem',
      );

    return await this.getTinyCookie(keys['tinyLogin'], keys['tinyPassword']);
  }

  async getTinyCookie(login: string, password: string): Promise<object> {
    console.log('Starting to get tiny cookie');

    const aLogin = await this.applicationService.sendXRequest({
      login,
      password,
    });

    // console.log('aLogin success');

    const { dynamicUrl, setCookieResponse } = aLogin;
    // console.log(setCookieResponse)

    const bLogin = await this.applicationService.sendYRequest(
      dynamicUrl,
      login,
      password,
      setCookieResponse,
    );

    const { tinyCookie, code } = bLogin;

    // console.log('bLogin success');

    const eLogin = await this.applicationService.sendBRequest(
      {
        metd: constants.E_LOGIN_FUNC_METD,
        login,
        password,
        code,
      },
      constants.SCRAPED_LOGIN_ENDPOINT,
    );

    // console.log('eLogin sucess');

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
      constants.SCRAPED_LOGIN_ENDPOINT,
    );

    // console.log('passed bRequest login');

    // console.log(tinyCookie)

    return tinyCookie;
  }

  async updateItemsOperation(
    id: string,
    tempInvoiceId: string,
    operationId: string,
    operationName: string,
  ): Promise<object> {
    console.log('Updating items operation -', id);
    const response = await this.applicationService.sendBRequest(
      {
        func: constants.UPDATE_ITEMS_OPERATION_FUNC,
        invoiceId: id,
        tempInvoiceId: tempInvoiceId,
        operationId: operationId,
        operationName: operationName,
      },
      constants.SCRAPED_INVOICE_ENDPOINT,
    );

    return response;
  }

  async calcTax(id: string, tempInvoiceId: string): Promise<object> {
    // console.log('Calculating taxes -', id);
    const response = await this.applicationService.sendBRequest(
      {
        func: constants.CALC_TAXES_FUNC,
        invoiceId: id,
        tempInvoiceId: tempInvoiceId,
      },
      constants.SCRAPED_INVOICE_ENDPOINT,
    );

    console.log('calculate taxes response', response);

    // Try to get the calculated values from the response
    const mappedResponse = this.mapObject(response, null) as any;

    // If mapObject doesn't return proper tax values, try to extract them from the raw response
    if (!mappedResponse.valorProdutos || !mappedResponse.valorICMS) {
      console.log('Tax calculation response may need manual parsing');
      console.log('Mapped response keys:', Object.keys(mappedResponse));

      // Look for specific patterns in the response that might contain the calculated values
      const responseText = JSON.stringify(response);
      const valorProdutosMatch = responseText.match(
        /valorProdutos["\s]*:[\s]*["\s]*([^"\s,}]+)/,
      );
      const valorICMSMatch = responseText.match(
        /valorICMS["\s]*:[\s]*["\s]*([^"\s,}]+)/,
      );
      const baseICMSMatch = responseText.match(
        /baseICMS["\s]*:[\s]*["\s]*([^"\s,}]+)/,
      );
      const valorTotalFCPMatch = responseText.match(
        /valorTotalFCP["\s]*:[\s]*["\s]*([^"\s,}]+)/,
      );
      const valorTotalICMSFCPDestinoMatch = responseText.match(
        /valorTotalICMSFCPDestino["\s]*:[\s]*["\s]*([^"\s,}]+)/,
      );
      const percentualICMSFCPDestinoMatch = responseText.match(
        /percentualICMSFCPDestino["\s]*:[\s]*["\s]*([^"\s,}]+)/,
      );
      const valorTotalICMSPartilhaDestinoMatch = responseText.match(
        /valorTotalICMSPartilhaDestino["\s]*:[\s]*["\s]*([^"\s,}]+)/,
      );
      const valorTotalICMSPartilhaOrigemMatch = responseText.match(
        /valorTotalICMSPartilhaOrigem["\s]*:[\s]*["\s]*([^"\s,}]+)/,
      );
      const percentualICMSPartilhaDestinoMatch = responseText.match(
        /percentualICMSPartilhaDestino["\s]*:[\s]*["\s]*([^"\s,}]+)/,
      );
      const valorAproximadoImpostosTotalMatch = responseText.match(
        /valorAproximadoImpostosTotal["\s]*:[\s]*["\s]*([^"\s,}]+)/,
      );

      if (valorProdutosMatch || valorICMSMatch || baseICMSMatch || valorTotalFCPMatch || valorTotalICMSFCPDestinoMatch || valorTotalICMSPartilhaDestinoMatch) {
        console.log('Found tax values in response, updating mappedResponse');
        if (valorProdutosMatch) {
          mappedResponse.valorProdutos = valorProdutosMatch[1];
          console.log('Found valorProdutos:', valorProdutosMatch[1]);
        }
        if (valorICMSMatch) {
          mappedResponse.valorICMS = valorICMSMatch[1];
          console.log('Found valorICMS:', valorICMSMatch[1]);
        }
        if (baseICMSMatch) {
          mappedResponse.baseICMS = baseICMSMatch[1];
          console.log('Found baseICMS:', baseICMSMatch[1]);
        }
        if (valorTotalFCPMatch) {
          mappedResponse.valorTotalFCP = valorTotalFCPMatch[1];
          console.log('Found valorTotalFCP:', valorTotalFCPMatch[1]);
        }
        if (valorTotalICMSFCPDestinoMatch) {
          mappedResponse.valorTotalICMSFCPDestino = valorTotalICMSFCPDestinoMatch[1];
          console.log('Found valorTotalICMSFCPDestino:', valorTotalICMSFCPDestinoMatch[1]);
        }
        if (percentualICMSFCPDestinoMatch) {
          mappedResponse.percentualICMSFCPDestino = percentualICMSFCPDestinoMatch[1];
          console.log('Found percentualICMSFCPDestino:', percentualICMSFCPDestinoMatch[1]);
        }
        if (valorTotalICMSPartilhaDestinoMatch) {
          mappedResponse.valorTotalICMSPartilhaDestino = valorTotalICMSPartilhaDestinoMatch[1];
          console.log('Found valorTotalICMSPartilhaDestino:', valorTotalICMSPartilhaDestinoMatch[1]);
        }
        if (valorTotalICMSPartilhaOrigemMatch) {
          mappedResponse.valorTotalICMSPartilhaOrigem = valorTotalICMSPartilhaOrigemMatch[1];
          console.log('Found valorTotalICMSPartilhaOrigem:', valorTotalICMSPartilhaOrigemMatch[1]);
        }
        if (percentualICMSPartilhaDestinoMatch) {
          mappedResponse.percentualICMSPartilhaDestino = percentualICMSPartilhaDestinoMatch[1];
          console.log('Found percentualICMSPartilhaDestino:', percentualICMSPartilhaDestinoMatch[1]);
        }
        if (valorAproximadoImpostosTotalMatch) {
          mappedResponse.valorAproximadoImpostosTotal =
            valorAproximadoImpostosTotalMatch[1];
          console.log('Found valorAproximadoImpostosTotal:', valorAproximadoImpostosTotalMatch[1]);
        }
      } else {
        console.log('No tax values found in response text');
        console.log('Response text sample:', responseText.substring(0, 500));
      }
    }

    return mappedResponse;
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
