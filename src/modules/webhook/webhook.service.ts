import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApplicationFacade } from '../application/application.facade';
import { WebRepository } from '../web/web.repository';
import { AddInvoiceDto } from '../application/models/addInvoice.dto';
import { UserKeysDto } from './models/userKeys.dto';
import { WebService } from '../web/web.service';
import { CookieJar } from 'tough-cookie';

@Injectable()
export class WebhookService {
  constructor(
    @Inject(ApplicationFacade)
    private readonly applicationFacade: ApplicationFacade,
    private readonly webRepository: WebRepository,
    private readonly webService: WebService,
  ) {}

  private getCrtByStore(storeName: string): string {
    // Define CRT values based on store/account
    // CRT 1 = Lucro Presumido/Real, CRT 3 = Simples Nacional
    const crtMap: { [key: string]: string } = {
      'goldtech': '1',    // Lucro Presumido/Real
      'megatech': '3',    // Simples Nacional
    };

    return crtMap[storeName] || '1'; // Default to '1' if store not found
  }

  async testWebhook(id: string, store: string) {
    const storeName = id.substring(0, 1) === '1' ? 'goldtech' : 'megatech';
    const userKeys = await this.webRepository.getApiKeyAndIdByName(storeName);

    const keys = new UserKeysDto(userKeys);

    // Determine CRT based on store/account
    const crt = this.getCrtByStore(storeName);

    return await this.startRoutine(id, keys, store, crt);
  }

  async receiveCustomWebhook(
    body: object,
    storeName: string,
    store: string,
  ): Promise<object> {
    console.log(body);
    if (
      body.hasOwnProperty('dados') &&
      body['dados'].hasOwnProperty('codigoSituacao') &&
      body['dados']['codigoSituacao'] === 'preparando_envio' &&
      body['dados']['idNotaFiscal'] != '0'
    ) {
      const isActive = await this.webRepository.getBotIsActiveByName(storeName);
      if (isActive['botIsActive']) {
        const userKeys = await this.webRepository.getApiKeyAndIdByName(
          storeName,
        );
        const keys = new UserKeysDto(userKeys);

        // Determine CRT based on store/account
        const crt = this.getCrtByStore(storeName);

        return await this.startRoutine(
          body['dados']['idNotaFiscal'],
          keys,
          store,
          crt,
        );
      }

      return { message: 'Tinytools is not active for ' + storeName };
    }
  }

  async startRoutine(
    id: string,
    userKeys: UserKeysDto,
    store: string,
    crt: string,
  ): Promise<object> {
    try {
      console.log('Starting routine for -', id);
      // eslint-disable-next-line no-var
      var now = new Date();
      // eslint-disable-next-line no-var
      var result = {
        time: now.toISOString(),
        status_code: 999,
        message: 'An error has occurred.',
      };
      const priceReferences = await this.webService.getItems(userKeys.userId);
      // console.log(priceReferences, 'aqui');
      // console.log(
      //   'priceReferences =>',
      //   priceReferences.find((ref) => ref.sku == `561028`),
      // );

      // console.log(cookie, 'cookiee')
      let invoice;

      try {
        invoice = await this.applicationFacade.searchInvoice(id);
      } catch (e) {
        const cookie = await this.applicationFacade.getTinyCookieById(
          userKeys.userId,
        );

        invoice = await this.applicationFacade.searchInvoice(id);
        console.log(e);
      }

      let changedInvoice = false;

      for (const item of invoice['itemsArray']) {
        // console.log('item =>', item);

        const reference = priceReferences.find(
          (ref) => ref.sku === item.codigo && ref.isActive === true,
        );

        // console.log(reference, 'different prices for this ref');

        if (reference && item.valorUnitario !== reference.price) {
          // console.log('different prices');
          const tempItem = await this.applicationFacade.getTempItem(
            id,
            item.id,
          );

          // console.log(tempItem);

          if (store === 'mercado' && reference.mercadoActive) {
            const x = await this.applicationFacade.addTempItem(
              id,
              item.id,
              invoice['idNotaTmp'],
              reference.mercadoPrice,
              tempItem,
            );
          } else if (store === 'shopee' && reference.shopeeActive) {
            const x = await this.applicationFacade.addTempItem(
              id,
              item.id,
              invoice['idNotaTmp'],
              reference.shopeePrice,
              tempItem,
            );

            console.log('caiu no shopee');
          } else if (store === 'aliexpress' && reference.aliActive) {
            const x = await this.applicationFacade.addTempItem(
              id,
              item.id,
              invoice['idNotaTmp'],
              reference.aliPrice,
              tempItem,
            );
          } else if (store === 'shein' && reference.sheinActive) {
            const x = await this.applicationFacade.addTempItem(
              id,
              item.id,
              invoice['idNotaTmp'],
              reference.sheinPrice,
              tempItem,
            );
          } else if (store === 'tiktok' && reference.tiktokActive) {
            const x = await this.applicationFacade.addTempItem(
              id,
              item.id,
              invoice['idNotaTmp'],
              reference.tiktokPrice,
              tempItem,
            );
          }

          changedInvoice = true;
        }
      }

      console.log(changedInvoice, '<= changedInvoice');

      if (true) {
        // Update items operation (Natureza da Operacao)
        const updateItemsOperation =
          await this.applicationFacade.updateItemsOperation(
            id,
            invoice['idNotaTmp'],
            invoice['idTipoNota'],
            invoice['natureza'],
          );

        console.log(updateItemsOperation, '<= updateItemsOperation');

        console.log('About to save invoice with ICMS values:', {
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

        await this.applicationFacade.addInvoice(id, new AddInvoiceDto(invoice, crt));

        invoice = await this.applicationFacade.searchInvoice(id);

        await this.applicationFacade.addInvoice(id, new AddInvoiceDto(invoice, crt));

        await this.applicationFacade.sendInvoice(
          userKeys.apiKey,
          parseInt(id),
          'N',
        );

        result = {
          ...result,
          status_code: 200,
          message: 'Invoice ' + id + ' sent.',
        };
        console.log(result);
        return result;
      }

      result = {
        ...result,
        status_code: 200,
        message: 'Nothing to be changed in invoice ' + id,
      };
      console.log(result);
    } catch (e) {
      throw Error(e);
    }
  }
}
