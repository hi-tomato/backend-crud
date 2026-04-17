import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  Like,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { OrderType } from './const/enum';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
import { OffsetPaginationDto } from './dto/offset-pagination.dto';

@Injectable()
export class CommonService {
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('MINIO_REGION'),
      endpoint: this.configService.get<string>('MINIO_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ACCESS_KEY') || '',
        secretAccessKey:
          this.configService.get<string>('MINIO_SECRET_KEY') || '',
      },
      forcePathStyle: true,
    });
  }

  /** 페이지네이션 정보 반환 */
  async paginate<T>(
    dto: OffsetPaginationDto,
    repository: Repository<ObjectLiteral & T>,
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
      } as FindOptionsOrder<ObjectLiteral & T>,
      where: where as FindOptionsWhere<ObjectLiteral & T>[],
      relations: relations as FindOptionsRelations<ObjectLiteral & T>,
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

  /** 커서 페이지네이션 정보 반환 */
  async cursorPaginate<T>(
    dto: CursorPaginationDto,
    repository: Repository<ObjectLiteral & T>,
    relations?: string[],
  ) {
    // 1) QueryBuilder 생성
    //    createQueryBuilder('entity')
    //    orderBy('entity.id', __order)
    //    take(__limit + 1)
    const queryBuilder = repository
      .createQueryBuilder('entity')
      .orderBy('entity.id', dto.__order)
      .take(dto.__limit + 1);

    // 2) relations forEach로 JOIN
    //    relations?.forEach((rel) => {
    //      qb.leftJoinAndSelect(`entity.${rel}`, rel)
    //    })
    relations?.forEach((rel) => {
      queryBuilder.leftJoinAndSelect(`entity.${rel}`, rel);
    });

    // 3) cursor 있을 때만 WHERE 추가
    //    DESC → WHERE entity.id < :cursor
    //    ASC  → WHERE entity.id > :cursor
    if (dto.__cursor) {
      if (dto.__order === OrderType.DESC) {
        queryBuilder.where('entity.id < :cursor', { cursor: dto.__cursor });
      }
      if (dto.__order === OrderType.ASC) {
        queryBuilder.where('entity.id > :cursor', { cursor: dto.__cursor });
      }
    }

    // 4) getMany() 실행
    const results = await queryBuilder.getMany();

    // 5) limit+1 트릭으로 hasNextPage 판단
    const hasNextPage = results.length > dto.__limit;

    const data = hasNextPage ? results.slice(0, dto.__limit) : results;

    // 6) nextCursor = data[data.length-1].id (마지막 항목)
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    // 7) 반환
    //    { data, meta: { count, nextCursor, hasNextPage } }
    return {
      data,
      meta: {
        count: data.length,
        nextCursor,
        hasNextPage,
      },
    };
  }

  uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일이 존재하지 않습니다.');
    }

    return {
      imageUrl: `${this.configService.get('PROTOCOL')}://${this.configService.get('HOST')}/public/images/${file.filename}`,
    };
  }

  uploadImages(files: Express.Multer.File[]) {
    return {
      imageUrls: files.map(
        (file) =>
          `${this.configService.get('PROTOCOL')}://${this.configService.get('HOST')}/public/images/${file.filename}`,
      ),
    };
  }

  async getPresignedUrl(fileName: string) {
    const uniqueFileName = randomUUID() + extname(fileName);

    const command = new PutObjectCommand({
      Bucket: this.configService.get<string>('MINIO_BUCKET'),
      Key: uniqueFileName,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
    });

    return {
      presignedUrl: signedUrl,
      key: uniqueFileName,
    };
  }

  async getPresignedUrls(fileNames: string[]) {
    return Promise.all(
      fileNames.map((fileName) => this.getPresignedUrl(fileName)),
    );
  }
}
