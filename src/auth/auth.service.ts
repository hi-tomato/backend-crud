import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  generateTokens(userId: number, email: string) {
    const payload = { userId, email };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const { email, name, password, passwordConfirm } = dto;

    const existingUser = await this.usersService.findOneByEmail(email);

    if (existingUser) {
      throw new ConflictException('해당 이메일은 이미 존재하는 이메일 입니다.');
    }

    if (password !== passwordConfirm) {
      throw new BadRequestException('입력하신 비밀번호가 일치하지 않습니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = this.generateTokens(newUser.id, newUser.email);

    return token;
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException('해당 이메일은 존재하지 않는 이메일입니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('입력하신 비밀번호가 일치하지 않습니다.');
    }

    return this.generateTokens(user.id, user.email);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        userId: number;
        email: string;
      }>(refreshToken);
      return this.generateTokens(payload.userId, payload.email);
    } catch {
      throw new UnauthorizedException('Refresh token이 유효하지 않습니다.');
    }
  }
}
