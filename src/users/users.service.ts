import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_CODES } from '../common/const/error-codes';
import { assertFound } from '../common/utils/assert';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: number) {
    return assertFound(
      await this.usersRepository.findOneBy({ id }),
      ERROR_CODES.USER.NOT_FOUND,
    );
  }

  create(dto: CreateUserDto) {
    const newUser = this.usersRepository.create(dto);

    return this.usersRepository.save(newUser);
  }

  async delete(id: number) {
    await this.findOne(id);

    return this.usersRepository.delete(id);
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    await this.usersRepository.update(id, dto);

    return this.findOne(id);
  }

  findOneByEmail(email: string) {
    return this.usersRepository.findOneBy({ email });
  }
}
