import { Inject, Injectable } from '@nestjs/common';
import { ApplicationFacade } from '../application/application.facade';
import { WebRepository } from '../web/web.repository';
import { AddInvoiceDto } from '../application/models/addInvoice.dto';
import { UserKeysDto } from './models/userKeys.dto';
import { WebService } from '../web/web.service';

@Injectable()
export class WebhookService {
  constructor(
    @Inject(ApplicationFacade)
    private readonly applicationFacade: ApplicationFacade,
    private readonly webRepository: WebRepository,
    private readonly webService: WebService,
  ) {}

  async testWebhook(id: string) {
    const storeName = 'goldtech';
    const userKeys = await this.webRepository.getApiKeyAndIdByName(storeName);

    const keys = new UserKeysDto(userKeys);
    return await this.startRoutine(id, keys);
  }

  async receiveCustomWebhook(body: object, storeName: string): Promise<object> {
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
        return await this.startRoutine(body['dados']['idNotaFiscal'], keys);
      }

      return { message: 'Tinytools is not active for ' + storeName };
    }
  }

  async startRoutine(id: string, userKeys: UserKeysDto): Promise<object> {
    try {
      // eslint-disable-next-line no-var
      var now = new Date();
      // eslint-disable-next-line no-var
      var result = {
        time: now.toISOString(),
        status_code: 999,
        message: 'An error has occurred.',
      };
      const priceReferences = await this.webService.getItems(userKeys.userId);
      const cookie = await this.applicationFacade.getTinyCookieById(
        userKeys.userId,
      );
      let invoice = await this.applicationFacade.searchInvoice(
        cookie['cookie'],
        id,
      );

      let changedInvoice = false;

      for (const item of invoice['itemsArray']) {
        const reference = priceReferences.find(
          (ref) => ref.sku === item.codigo && ref.isActive === true,
        );

        if (reference && item.valorUnitario !== reference.price) {
          const tempItem = await this.applicationFacade.getTempItem(
            cookie['cookie'],
            id,
            item.id,
          );

          // console.log(tempItem);

          const x = await this.applicationFacade.addTempItem(
            cookie['cookie'],
            id,
            item.id,
            invoice['idNotaTmp'],
            reference.price,
            tempItem,
          );

          console.log(x);

          changedInvoice = true;
        }
      }

      if (changedInvoice) {
        await this.applicationFacade.addInvoice(
          cookie['cookie'],
          id,
          new AddInvoiceDto(invoice),
        );

        invoice = await this.applicationFacade.searchInvoice(
          cookie['cookie'],
          id,
        );

        await this.applicationFacade.addInvoice(
          cookie['cookie'],
          id,
          new AddInvoiceDto(invoice),
        );

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
      result = { ...result, status_code: e.statusCode, message: e.message };
      return result;
    }
  }
}
