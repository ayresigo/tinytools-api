import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Header,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from '../web/models/dto/signIn.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { CookieGuard } from './cookie.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() body: SignInDto) {
    return this.authService.signIn(body);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(CookieGuard)
  @Get('cookieProfile')
  getCookieProfile(@Request() req) {
    return req.cookie;
  }

  @HttpCode(HttpStatus.OK)
  @Get('healthCheck')
  healthCheck() {
    return HttpStatus.OK;
  }
}
