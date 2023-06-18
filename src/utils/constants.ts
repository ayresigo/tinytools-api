export const constants = {
  PROVIDED_BASE_URL: 'https://api.tiny.com.br/api2/',
  PROVIDED_SEND_INVOICE_ENDPOINT: 'nota.fiscal.emitir.php',

  SCRAPED_BASE_URL: 'https://erp.tiny.com.br/',
  SCRAPED_INVOICE_ENDPOINT: 'services/notas.fiscais.server.php',
  SCRAPED_FRONT_VERSTION: '3.52.04',

  AUTH_ERROR_PREFIX: 'alert(',
  INVOICE_ITEM_PREFIX: 'setarArrayItens(',
  TEMP_ITEM_PREFIX: 'callbackEditarItem(',
  SENT_TEMP_ITEM_PREFIX: 'callbackSalvarEdicaoItem(',

  GET_INVOICE_FUNC: 'obterNotaFiscal',
  GET_TEMP_ITEM_FUNC: 'obterItemTmp',
  ADD_INVOICE_FUNC: 'salvarNotaFiscal',
  ADD_TEMP_ITEM_FUNC: 'adicionarItemTmpXajax',
  CALC_TAXES_FUNC: 'calcularImpostos',

  MAX_PROCESSED_BODIES_SIZE: 100,
  CLEANUP_INTERVAL_MS: 3600000,
};
