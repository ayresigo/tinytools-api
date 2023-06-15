import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto } from '../web/models/dto/signIn.dto';
import { WebRepository } from '../web/web.repository';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private webRepository: WebRepository,
    private jwtService: JwtService,
  ) {}

  async signIn(info: SignInDto) {
    try {
      const user = await this.webRepository.getUserByUserAndPassword(info);
      const payload = { id: user.id, username: user.username };
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
