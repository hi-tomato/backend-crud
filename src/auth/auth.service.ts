import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ERROR_MESSAGES } from '../common/const/error-messages';
import { UserRole } from '../users/const/userRole';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(userId: number, email: string, role: UserRole) {
    const payload = { userId, email, role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const { email, name, password, passwordConfirm } = dto;

    const existingUser = await this.usersService.findOneByEmail(email);

    if (existingUser) {
      throw new ConflictException(ERROR_MESSAGES.USER.EMAIL_EXISTS);
    }

    if (password !== passwordConfirm) {
      throw new BadRequestException(ERROR_MESSAGES.USER.PASSWORD_MISMATCH);
    }

    const hashedPassword = await bcrypt.hash(
      password,
      this.configService.get<number>('BCRYPT_ROUNDS') ?? 10,
    );

    const newUser = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = this.generateTokens(newUser.id, newUser.email, newUser.role);

    return token;
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException(ERROR_MESSAGES.USER.PASSWORD_MISMATCH);
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        userId: number;
        email: string;
        role: UserRole;
      }>(refreshToken);
      return this.generateTokens(payload.userId, payload.email, payload.role);
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.COMMON.INVALID_TOKEN);
    }
  }
}
