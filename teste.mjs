import got from 'got';
import { CookieJar } from 'tough-cookie';

const cookieJar = new CookieJar();

await cookieJar.setCookie(
  'TINYSESSID=vsfju5692t5d0ddf97f96nbn1h2avovs',
  'https://erp.tiny.com.br/',
);

async function fetchData() {
  const url = 'https://erp.tiny.com.br/services/notas.fiscais.server.php';
  const headers = {
    accept: 'application/json, text/javascript, */*; q=0.01',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    pragma: 'no-cache',
    'sec-ch-ua':
      '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'x-custom-request-for': 'XAJAX',
    'x-requested-with': 'XMLHttpRequest',
    'x-user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  const referrer = 'https://erp.tiny.com.br/notas_fiscais';
  const referrerPolicy = 'strict-origin-when-cross-origin';

  const body =
    'type=1&func=obterNotaFiscal&argsLength=44&timeInicio=1702666746406&versaoFront=3.58.23&pageTime=1702666394&pageLastPing=1702666699512&location=https%3A%2F%2Ferp.tiny.com.br%2Fnotas_fiscais%23edit%2F1024476869&duplicidade=0&args=%5B%221024476869%22%2C%22%22%2C%22N%22%2C%22desabilitarEdicao%22%2C55%5D';

  const options = {
    headers,
    body,
    cookieJar,
  };

  try {
    const response = await got.post(url, options);

    console.log(response.body); // This will contain the response body
  } catch (error) {
    console.error(error.response.body);
  }
}

fetchData();
