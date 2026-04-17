import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { OrderByType, OrderType } from '../const/enum';

export class OffsetPaginationDto {
  constructor() {}

  @ApiPropertyOptional({ example: 1, description: '페이지 번호' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: '한 페이지당 항목 수 (10~100)',
    minimum: 10,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    enum: OrderType,
    example: OrderType.DESC,
    description: '정렬 방향',
  })
  @IsOptional()
  @IsString()
  @IsEnum(OrderType)
  __order: OrderType = OrderType.DESC;

  @ApiPropertyOptional({
    enum: OrderByType,
    example: OrderByType.TITLE,
    description: '정렬 기준',
  })
  @IsOptional()
  @IsString()
  @IsEnum(OrderByType)
  __orderBy: OrderByType = OrderByType.TITLE;

  @ApiPropertyOptional({
    example: '',
    description: '검색어 (제목, 내용, 작성자)',
  })
  @IsOptional()
  @IsString()
  __search: string = '';
}
