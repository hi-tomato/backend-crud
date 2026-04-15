import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { OrderType } from '../const/enum';

export class CursorPaginationDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  __cursor: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  __limit: number = 20;

  @IsOptional()
  @IsString()
  @IsEnum(OrderType)
  __order: OrderType = OrderType.DESC;
}
