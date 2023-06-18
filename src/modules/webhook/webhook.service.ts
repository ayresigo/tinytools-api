import { Inject, Injectable } from '@nestjs/common';
import { ApplicationFacade } from '../application/application.facade';
import { WebRepository, repository } from '../web/web.repository';
import { isEqual } from 'lodash';
import { AddInvoiceDto } from '../application/models/addInvoice.dto';
import { UserKeysDto } from './models/userKeys.dto';
import { WebService } from '../web/web.service';

@Injectable()
export class WebhookService {
  private processedBodies: Set<object> = new Set();
  private readonly maxProcessedBodiesSize: number = 1;

  constructor(
    @Inject(ApplicationFacade)
    private readonly applicationFacade: ApplicationFacade,
    private readonly webRepository: WebRepository,
    private readonly webService: WebService,
  ) {}

  async testWebhook(id: string) {
    const storeName = 'goldtech';
    const userKeys = await this.webRepository.getUserKeysByName(storeName);

    const keys = new UserKeysDto(userKeys);
    return await this.startRoutine(id, keys);
  }

  async receiveGoldtech(body: object): Promise<object> {
    if (
      body.hasOwnProperty('dados') &&
      body['dados'].hasOwnProperty('codigoSituacao') &&
      body['dados']['codigoSituacao'] === 'preparando_envio' &&
      body['dados']['idNotaFiscal'] != '0'
    ) {
      const storeName = 'goldtech';
      const userKeys = await this.webRepository.getUserKeysByName(storeName);

      const keys = new UserKeysDto(userKeys);
      return await this.startRoutine(body['dados']['idNotaFiscal'], keys);
    }
  }

  async startRoutine(id: string, userKeys: UserKeysDto): Promise<object> {
    try {
      const priceReferences = await this.webService.getItems(userKeys.userId);

      let invoice = await this.applicationFacade.searchInvoice(
        userKeys.cookie,
        id,
      );

      let changedInvoice = false;

      for (const item of invoice['itemsArray']) {
        const reference = priceReferences.find(
          (ref) => ref.sku === item.codigo && ref.isActive === true,
        );

        if (reference && item.valorUnitario !== reference.price) {
          const tempItem = await this.applicationFacade.getTempItem(
            userKeys.cookie,
            id,
            item.id,
          );

          await this.applicationFacade.addTempItem(
            userKeys.cookie,
            id,
            item.id,
            invoice['idNotaTmp'],
            reference.price,
            tempItem,
          );

          changedInvoice = true;
        }
      }

      if (changedInvoice) {
        await this.applicationFacade.addInvoice(
          userKeys.cookie,
          id,
          new AddInvoiceDto(invoice),
        );

        invoice = await this.applicationFacade.searchInvoice(
          userKeys.cookie,
          id,
        );

        return await this.applicationFacade.addInvoice(
          userKeys.cookie,
          id,
          new AddInvoiceDto(invoice),
        );

        return await this.applicationFacade.sendInvoice(
          userKeys.apiKey,
          parseInt(id),
          'N',
        );
      }

      return {
        message: 'No item to change',
      };
    } catch (e) {
      return { status_code: e.statusCode, message: e.message };
    }
  }
}
