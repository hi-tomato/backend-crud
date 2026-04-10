import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`검색하신 유저 ${id}가 존재하지 않습니다.`);
    }

    return user;
  }

  create(dto: CreateUserDto) {
    const newUser = this.usersRepository.create(dto);

    return this.usersRepository.save(newUser);
  }

  async delete(id: number) {
    const result = await this.usersRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`검색하신 유저 ${id}가 존재하지 않습니다.`);
    }

    return result;
  }

  async update(id: number, dto: UpdateUserDto) {
    const result = await this.usersRepository.update(id, dto);

    if (result.affected === 0) {
      throw new NotFoundException(`검색하신 유저 ${id}가 존재하지 않습니다.`);
    }

    return this.findOne(id);
  }

  findOneByEmail(email: string) {
    return this.usersRepository.findOneBy({ email });
  }
}
