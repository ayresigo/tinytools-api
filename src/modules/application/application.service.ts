import { BadRequestException, Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { CookieJar } from 'tough-cookie';
import { constants } from 'src/utils/constants';
import { AddInvoiceDto } from './models/addInvoice.dto';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

@Injectable()
export class ApplicationService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendXRequest(params: object) {
    try {
      const url =
        'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth?client_id=tiny-webapp&redirect_uri=https://erp.tiny.com.br/login&scope=openid&response_type=code';
      const response = await client.get(url, {});
      const $ = cheerio.load(response.data);
      const form = $('#kc-content-wrapper').children().attr();
      const dynamicUrl = form.action;
      const setCookieResponse = response.headers['set-cookie'];
      return { response, dynamicUrl, setCookieResponse };
    } catch (e) {
      console.log('we do not throw catches');
    }
  }

  async sendYRequest(
    dynamicUrl: string,
    username: string,
    password: string,
    setCookieResponse: string[],
  ) {
    try {
      const form = `username=${username}&password=${password}`;
      const params = setCookieResponse;

      const response = await axios.post(dynamicUrl, form, {
        headers: {
          cookie: params.toString() + `; tinyuser=${username};`,
          Host: 'accounts.tiny.com.br',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data?.retorno?.codigo_erro)
        throw new BadRequestException(response.data.retorno.erros[0].erro);

      const responseX = new URLSearchParams(response.request?.res?.responseUrl);

      return {
        tinyCookie: await this.handleCookie(response),
        code: responseX.get('code'),
      };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async handleCookie(response: AxiosResponse) {
    const pattern = /TINYSESSID=([^;]+)/;
    for (const item of response.headers[`set-cookie`]) {
      const match = item.match(pattern);
      if (match) {
        const sessionId = match[1];
        await jar.setCookie(
          'TINYSESSID=' + sessionId,
          'https://erp.tiny.com.br/',
        );
        return { cookie: sessionId };
      }
    }
  }

  async sendARequest(endpoint: string, params: object, apiKey: string) {
    try {
      const url = `${constants.PROVIDED_BASE_URL}${endpoint}`;
      const paramters = {
        token: apiKey,
        formato: 'json',
        ...params,
      };
      const response = await client.get(url, { params: paramters });

      if (response.data.retorno.codigo_erro)
        throw new BadRequestException(response.data.retorno.erros[0].erro);

      return response.data;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async sendBRequest(params: object, cookie: string, endpoint: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const querystring = require('querystring');
      const url = `${constants.SCRAPED_BASE_URL}${endpoint}`;
      const data = this.generateBRequestData(params, endpoint);

      const headers = {
        'x-custom-request-for': 'XAJAX',
      };

      // eslint-disable-next-line no-var
      var response = await client.post(url, querystring.stringify(data), {
        headers,
      });
    } catch (e) {
      console.log('sendBRequest catch');
      throw new BadRequestException(e.message);
    }

    if (
      response.data['response'].length == 1 &&
      response.data['response'][0]['src']?.includes(constants.AUTH_ERROR_PREFIX)
    )
      if ('metd' in params && params['metd'] == constants.F_LOGIN_FUNC_METD) {
        // console.log('AUTH ERROR RESOPNSE BODY LEMAS CHECK');
        // Obtendo cookie de autênticação:
        // Como o método principal retorna response.data e o cookie de sessão vem via header, precisamos retornar ele aqui nesse momento.
        return this.handleCookie(response);
      }

    return response.data;
  }

  generateBRequestData(params: object, endpoint: string) {
    let args = `[]`;
    if (endpoint === constants.SCRAPED_INVOICE_ENDPOINT) {
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
          const invoice = new AddInvoiceDto(params['invoice']);
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
    } else if (endpoint === constants.SCRAPED_LOGIN_ENDPOINT) {
      switch (params['metd']) {
        case constants.E_LOGIN_FUNC_METD:
          args = `[{"login":"${params['login']}","senha":"${params['password']}","derrubarSessoes":true,"ehParceiro":false,"captchaResponse":"","code":"${params['code']}","sessionAccounts":{}}]`;
          break;
        case constants.F_LOGIN_FUNC_METD:
          args = `["${params['uidLogin']}",${params['idUsuario']},null]`;
          break;
      }
      try {
      } catch (e) {
        throw new BadRequestException(e.message);
      }

      return {
        type: 2,
        'func[clss]': constants.LOGIN_FUNC_CLSS,
        'func[metd]': params['metd'],
        argsLength: args.length,
        timeInicio: new Date().getTime(),
        versaoFront: constants.SCRAPED_FRONT_VERSTION,
        location: `${constants.SCRAPED_BASE_URL}login`,
        duplicidade: 0,
        args: args,
      };
    }
  }
}
