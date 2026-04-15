import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FindOptionsRelations, Like, Repository } from 'typeorm';
import { OffsetPaginationDto } from './dto/offset-pagination.dto';

@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}

  /** 페이지네이션 정보 반환 */
  async paginate<T>(
    dto: OffsetPaginationDto,
    repository: Repository<any>,
    relations?: FindOptionsRelations<T>,
  ) {
    const { page, limit, __orderBy, __order, __search } = dto;

    const where = __search
      ? [
          { title: Like(`%${__search}%`) },
          { content: Like(`%${__search}%`) },
          { author: { name: Like(`%${__search}%`) } },
        ]
      : [];

    const [data, total] = await repository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: {
        [__orderBy]: __order,
      },
      where,
      relations,
    });

    const lastPage = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage,
        hasNextPage: page < lastPage,
      },
    };
  }
}
