import {
  Controller,
  Post,
  Query,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddInvoiceDto } from './models/addInvoice.dto';
import { CookieGuard } from '../auth/cookie.guard';
import { AuthGuard } from '../auth/auth.guard';
import { ApplicationFacade } from './application.facade';

@ApiTags('Application')
@Controller('app')
export class ApplicationController {
  constructor(private readonly applicationFacade: ApplicationFacade) {}

  @UseGuards(CookieGuard)
  @Get('product')
  async SearchProduct(
    @Request() req,
    @Query('search') search: string,
  ): Promise<object> {
    return await this.applicationFacade.searchProduct(req.apiKey, search);
  }

  @UseGuards(AuthGuard)
  @Get('getCookie')
  async GetTinyCookie(@Request() req): Promise<object> {
    return await this.applicationFacade.getTinyCookieById(req.user.id);
  }

  @UseGuards(CookieGuard)
  @Get('invoice')
  async SearchInvoice(
    @Request() req,
    @Query('id') id: string,
  ): Promise<object> {
    return await this.applicationFacade.searchInvoice(req.cookie, id);
  }

  @UseGuards(CookieGuard)
  @Get('getTempItem')
  async GetTempItem(
    @Request() req,
    @Query('id') id: string,
    @Query('itemId') itemId: string,
  ): Promise<object> {
    return await this.applicationFacade.getTempItem(req.cookie, id, itemId);
  }

  @UseGuards(CookieGuard)
  @Get('calculateTax')
  async calcTax(
    @Request() req,
    @Query('id') id: string,
    @Query('tempInvoiceId') tempInvoiceId: string,
  ): Promise<object> {
    return await this.applicationFacade.calcTax(req.cookie, id, tempInvoiceId);
  }

  @UseGuards(CookieGuard)
  @HttpCode(HttpStatus.OK)
  @Post('addTempItem')
  async AddTempItem(
    @Request() req,
    @Query('id') id: string,
    @Query('itemId') itemId: string,
    @Query('tempInvoiceId') tempInvoiceId: string,
    @Query('newPrice') newPrice: string,
    @Body() body: object,
  ): Promise<object> {
    return await this.applicationFacade.addTempItem(
      req.cookie,
      id,
      itemId,
      tempInvoiceId,
      newPrice,
      body,
    );
  }

  @UseGuards(CookieGuard)
  @HttpCode(HttpStatus.OK)
  @Post('addInvoice')
  async AddInvoice(
    @Request() req,
    @Body() invoice: AddInvoiceDto,
    @Query('id') id: string,
  ): Promise<object> {
    return await this.applicationFacade.addInvoice(req.cookie, id, invoice);
  }

  @UseGuards(CookieGuard)
  @HttpCode(HttpStatus.OK)
  @Post('sendInvoice')
  async SendInvoice(
    @Request() req,
    @Query('id') id: string,
    @Query('sendEmail') sendEmail: string,
  ): Promise<object> {
    return await this.applicationFacade.sendInvoice(
      req.apiKey,
      parseInt(id),
      sendEmail,
    );
  }
}
