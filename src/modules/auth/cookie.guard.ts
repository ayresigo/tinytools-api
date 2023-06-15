import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class CookieGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookie = request.headers.cookie;

    if (!cookie) {
      throw new UnauthorizedException();
    }

    try {
      request['cookie'] = cookie;
    } catch (e) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
