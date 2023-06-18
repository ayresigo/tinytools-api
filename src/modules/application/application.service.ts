import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { constants } from 'src/utils/constants';
import { AddInvoiceDto } from './models/addInvoice.dto';

@Injectable()
export class ApplicationService {
  async sendARequest(endpoint: string, params: object, apiKey: string) {
    try {
      const url = `${constants.PROVIDED_BASE_URL}${endpoint}`;
      const paramters = {
        token: apiKey,
        formato: 'json',
        ...params,
      };
      const response = await axios.get(url, { params: paramters });

      if (response.data.retorno.codigo_erro)
        throw new BadRequestException(response.data.retorno.erros[0].erro);

      return response.data;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async sendBRequest(params: object, cookie: string) {
    try {
      const querystring = require('querystring');
      const url = `${constants.SCRAPED_BASE_URL}${constants.SCRAPED_INVOICE_ENDPOINT}`;
      const data = this.generateBRequestData(params);
      // const headers = constants.SCRAPED_HEADERS;
      const headers = {
        'x-custom-request-for': 'XAJAX',
        Cookie: 'TINYSESSID=' + cookie,
      };

      var response = await axios.post(url, querystring.stringify(data), {
        headers: headers,
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    if (
      response.data['response'].length == 1 &&
      response.data['response'][0]['src']?.includes(constants.AUTH_ERROR_PREFIX)
    )
      throw new UnauthorizedException();

    return response.data;
  }

  generateBRequestData(params: object) {
    let args = `[]`;
    switch (params['func']) {
      case constants.GET_INVOICE_FUNC:
        args = `["${params['invoiceId']}","","N","desabilitarEdicao",55]`;
        break;
      case constants.GET_TEMP_ITEM_FUNC:
        args = `[${params['itemId']},null]`;
        break;
      case constants.ADD_TEMP_ITEM_FUNC:
        args = `["${params['itemId']}","${
          params['tempInvoiceId']
        }",${JSON.stringify(params['tempItem'])},"E"]`;
        break;
      case constants.ADD_INVOICE_FUNC:
        let invoice = new AddInvoiceDto(params['invoice']);
        args =
          `["${params['invoiceId']}",` +
          `${JSON.stringify(invoice)},` +
          `"${invoice.idNotaTmp}",` +
          `true,[],"S"]`;
        break;
      case constants.CALC_TAXES_FUNC:
        args = `[-1,"I","${params['tempInvoiceId']}"]`;
        break;
    }

    return {
      type: 1,
      func: params['func'],
      argsLength: args.length,
      timeInicio: new Date().getTime(),
      versaoFront: constants.SCRAPED_FRONT_VERSTION,
      location: `${constants.SCRAPED_BASE_URL}notas_fiscais#edit/${params['invoiceId']}`,
      duplicidade: 0,
      args: args,
    };
  }
}
