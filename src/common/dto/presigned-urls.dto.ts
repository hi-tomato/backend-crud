import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class GetPresignedUrlsDto {
  @ApiProperty({ example: ['photo1.jpg', 'photo2.jpg'] })
  @IsArray()
  @IsString({ each: true })
  fileNames: string[];
}
