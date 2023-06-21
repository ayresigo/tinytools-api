import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { WebService } from './web.service';
import { ApiTags } from '@nestjs/swagger';
import { ProductDto } from './models/dto/product.dto';
import { ApiBody } from '@nestjs/swagger';
import { Product } from './models/entities/product.entity';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Web')
@Controller('api')
export class WebController {
  constructor(private readonly webService: WebService) {}

  @UseGuards(AuthGuard)
  @Get('getUserKeys')
  async getUserKeys(@Request() req): Promise<object> {
    return await this.webService.getObfuscatedUserKeys(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Put('editIsActive')
  async updateIsActive(
    @Request() req,
    @Query('isActive') isActive: boolean,
  ): Promise<object> {
    return await this.webService.updateBotIsActive(isActive, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get('getIsActive')
  async getIsActive(@Request() req): Promise<object> {
    return await this.webService.getIsActive(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get('getItems')
  async getItems(@Request() req): Promise<object> {
    return this.webService.getItems(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Post('addItems')
  @ApiBody({ type: [ProductDto] })
  async addItems(@Request() req, @Body() body: ProductDto[]): Promise<object> {
    return await this.webService.addItems(body, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Put('editItem')
  @ApiBody({ type: ProductDto })
  async updateItem(
    @Request() req,
    @Body() body: ProductDto,
    @Query('id') id: number,
  ): Promise<object> {
    return await this.webService.updateItem(id, body, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Delete('deleteItem')
  async deleteItem(@Request() req, @Query('id') id: number): Promise<Product> {
    return await this.webService.deleteItem(id, req.user.id);
  }
}
