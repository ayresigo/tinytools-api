import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import * as https from 'https';
import * as fs from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log(__dirname);

  // const httpsOptions = {
  //   cert: fs.readFileSync('caminho/do/certificado.crt'),
  //   key: fs.readFileSync('caminho/da/chave.privada.key'),
  // };

  const app: NestExpressApplication = await NestFactory.create(AppModule, 
  //   {
  //   httpsOptions,
  // }
  );
  const config: ConfigService = app.get(ConfigService);
  const port: number = config.get<number>('PORT');

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      transform: true,
    }),
  );

  const docs = new DocumentBuilder()
    .setTitle('Tiny tools API')
    .setDescription('TEM Docs')
    .setVersion('1.0')
    // .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, docs);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, () => {
    console.log('[WEB] Server running on port ' + port);
  });
}
bootstrap();
