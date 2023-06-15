export const constants = {
  API_TOKEN: 'e821418b6e81b6b1d5c7e14299d5b2fd4671b84c',
  PROVIDED_BASE_URL: 'https://api.tiny.com.br/api2/',
  PROVIDED_SEND_INVOICE_ENDPOINT: 'nota.fiscal.emitir.php',

  SCRAPED_BASE_URL: 'https://erp.tiny.com.br/',
  SCRAPED_INVOICE_ENDPOINT: 'services/notas.fiscais.server.php',
  SCRAPED_FRONT_VERSTION: '3.52.04',
  // SCRAPED_COOKIES: 'TINYSESSID=jqplr1bph4p2b6eierrak9bddq0egk4e',
  // SCRAPED_HEADERS: {
  //   'x-custom-request-for': 'XAJAX',
  //   Cookie: 'TINYSESSID=jqplr1bph4p2b6eierrak9bddq0egk4e',
  // },

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
