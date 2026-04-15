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

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  @IsEnum(OrderType)
  __order: OrderType = OrderType.DESC;

  @IsOptional()
  @IsString()
  @IsEnum(OrderByType)
  __orderBy: OrderByType = OrderByType.TITLE;

  @IsOptional()
  @IsString()
  __search: string = '';
}
