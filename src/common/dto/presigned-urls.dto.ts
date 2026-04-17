import { IsArray, IsString } from 'class-validator';

export class GetPresignedUrlsDto {
  @IsArray()
  @IsString({ each: true })
  fileNames: string[];
}
