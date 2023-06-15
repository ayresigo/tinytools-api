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
    return await this.start_routine(id, keys);
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
      return await this.start_routine(body['dados']['idNotaFiscal'], keys);
    }

    console.log(body);
  }

  async receiveWebhook(
    body: object,
    cookie: string,
    apiKey: string,
  ): Promise<object> {
    try {
      if (
        body.hasOwnProperty('dados') &&
        body['dados'].hasOwnProperty('codigoSituacao') &&
        body['dados']['codigoSituacao'] === 'preparando_envio' &&
        body['dados']['idNotaFiscal'] != '0' &&
        !this.isBodyProcessed(body)
      ) {
        // console.log(body);
        // this.startRoutine(body['dados']['idNotaFiscal']);
        console.log('#####################################');
        console.log(
          `Starting routine...\t\t\t[ Nome: ${body['dados']['cliente']['nome']} ]`,
        );

        if (this.processedBodies.size >= this.maxProcessedBodiesSize) {
          console.log('Cleaning up proccessed bodies');
          this.cleanupProcessedBodies();
        }

        this.processedBodies.add(body);

        await this.startRoutine(body['dados']['idNotaFiscal'], cookie, apiKey);
      }

      return { statusCode: 200 };
    } catch (e) {
      return { statuscode: e.statusCode, message: e.message };
    }
  }

  private isBodyProcessed(body: object): boolean {
    for (const processedBody of this.processedBodies) {
      if (isEqual(processedBody, body)) {
        return true;
      }
    }
    return false;
  }

  private cleanupProcessedBodies(): void {
    this.processedBodies.clear();
  }

  async startRoutine(
    id: string,
    cookie: string,
    apiKey: string,
  ): Promise<object> {
    try {
      let changedInvoice = false;
      console.log(`Trying to get invoice...\t\t[ InvoiceId: ${id} ]`);

      let invoice = await this.applicationFacade.searchInvoice(cookie, id);

      console.log(`Successfully retreived invoice...\t[ InvoiceId: ${id} ]`);

      let itemsLength = invoice['itemsArray'].length;

      console.log(
        `Found ${itemsLength} item${
          itemsLength > 1 ? 's' : '.'
        }..\t\t\t\t[ InvoiceId: ${id} ]`,
      );

      for (let i = 0; i < itemsLength; i++) {
        console.log(
          `Checking item sku [${i + 1}/${itemsLength}]...\t\t[ ItemId: ${
            invoice['itemsArray'][i]['id']
          } | SKU: ${invoice['itemsArray'][i]['codigo']} ]`,
        );
        for (let j = 0; j < repository.priceReferences.length; j++) {
          if (
            repository.priceReferences[j]['itemSku'] ==
            invoice['itemsArray'][i]['codigo']
          ) {
            if (
              invoice['itemsArray'][i]['valorUnitario'] !=
              repository.priceReferences[j]['itemPrice']
            ) {
              console.log(
                `Getting temp item...\t\t\t[ ItemId: ${invoice['itemsArray'][i]['id']} | SKU: ${invoice['itemsArray'][i]['codigo']} ]`,
              );

              let tempItem = await this.applicationFacade.getTempItem(
                cookie,
                id,
                invoice['itemsArray'][i]['id'],
              );

              console.log(
                `Successfully retreived temp item...\t[ ItemId: ${invoice['itemsArray'][i]['id']} | SKU: ${invoice['itemsArray'][i]['codigo']} ]`,
              );

              console.log(
                `Changing price...\t\t\t[ SKU: ${invoice['itemsArray'][i]['codigo']} | NewPrice: ${repository.priceReferences[j]['itemPrice']} | Quantity: ${invoice['itemsArray'][i]['quantidade']} ]`,
              );

              let sentTempItem = await this.applicationFacade.addTempItem(
                cookie,
                id,
                invoice['itemsArray'][i]['id'],
                invoice['idNotaTmp'],
                repository.priceReferences[j]['itemPrice'],
                tempItem,
              );

              console.log(
                `Successfully changed temp item price...\t[ SKU: ${invoice['itemsArray'][i]['codigo']} | NewPrice: ${sentTempItem['valorUnitario']} | Quantity: ${sentTempItem['quantidade']} | Total: ${sentTempItem['valorTotal']}]`,
              );

              changedInvoice = true;
            } else {
              console.log(
                `Item [${
                  i + 1
                }/${itemsLength}] already changed...\t\t[ ItemId: ${
                  invoice['itemsArray'][i]['id']
                } | SKU: ${invoice['itemsArray'][i]['codigo']} ]`,
              );
            }
          }
        }
      }

      if (changedInvoice) {
        console.log(`Sending invoice...\t\t\t[ InvoiceId: ${id} ]`);
        var newInvoice = new AddInvoiceDto(invoice);
        await this.applicationFacade.addInvoice(cookie, id, newInvoice);
        return await this.applicationFacade.sendInvoice(
          apiKey,
          parseInt(id),
          'N',
        );
      }

      console.log(`No item to change...\t\t\t[ InvoiceId: ${id} ]`);
      return {
        message: 'No item to change',
      };
    } catch (e) {
      return { status_code: e.statusCode, message: e.message };
    }
  }

  async start_routine(id: string, userKeys: UserKeysDto): Promise<object> {
    try {
      // Auxiliar para saber se a fatura foi ou não editada
      let changedInvoice = false;

      // Inicialização dos preços de referência (sku : preço : ativo)
      const priceReferences = await this.webService.getItems(userKeys.userId);

      // Obtém a fatura através do Id
      let invoice = await this.applicationFacade.searchInvoice(
        userKeys.cookie,
        id,
      );

      // Encurta invoice['itemsArray'].length para itemsLength
      let itemsLength = invoice['itemsArray'].length;

      // Itera os produtos presentes na fatura
      for (let i = 0; i < itemsLength; i++) {
        // Itera os produtos cadastrados no banco de dados
        for (let j = 0; j < priceReferences.length; j++) {
          console.log;
          // Se o produto for encontrado e tiver ativo
          if (
            priceReferences[j]['sku'] == invoice['itemsArray'][i]['codigo'] &&
            priceReferences[j]['isActive'] == true
          ) {
            console.log(priceReferences[j]);
            // Se o valor do produto ainda não foi alterado
            if (
              invoice['itemsArray'][i]['valorUnitario'] !=
              priceReferences[j]['price']
            ) {
              // Obtém o Temp Item deste produto (obrigatório)
              let tempItem = await this.applicationFacade.getTempItem(
                userKeys.cookie,
                id,
                invoice['itemsArray'][i]['id'],
              );

              // Altera e envia o Temp Item com o preço atualizado
              let sentTempItem = await this.applicationFacade.addTempItem(
                userKeys.cookie,
                id,
                invoice['itemsArray'][i]['id'],
                invoice['idNotaTmp'],
                priceReferences[j]['price'],
                tempItem,
              );

              // Sinaliza que pelo menos um produto da fatura foi alterado
              changedInvoice = true;
            }
          }
        }
      }

      // Se a fatura foi alterada
      if (changedInvoice) {
        // Inicializa nova Dto para lançar a fatura de volta
        var newInvoice = new AddInvoiceDto(invoice);

        // Lança a fatura de volta
        await this.applicationFacade.addInvoice(
          userKeys.cookie,
          id,
          newInvoice,
        );

        // Emite a fatura
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
