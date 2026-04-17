import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { OrderType } from '../const/enum';

export class CursorPaginationDto {
  @ApiPropertyOptional({
    example: 0,
    description: '커서 위치 (마지막 게시글 ID)',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  __cursor: number = 0;

  @ApiPropertyOptional({ example: 20, description: '가져올 게시글 수' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  __limit: number = 20;

  @ApiPropertyOptional({
    enum: OrderType,
    example: OrderType.DESC,
    description: '정렬 방향',
  })
  @IsOptional()
  @IsString()
  @IsEnum(OrderType)
  __order: OrderType = OrderType.DESC;
}
