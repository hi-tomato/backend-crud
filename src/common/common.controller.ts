import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CommonService } from './common.service';
import { GetPresignedUrlDto } from './dto/presigned-url.dto';
import { GetPresignedUrlsDto } from './dto/presigned-urls.dto';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.commonService.uploadImage(file);
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('images', 5))
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.commonService.uploadImages(files);
  }

  @Post('presigned-url')
  getPresignedUrl(@Body() dto: GetPresignedUrlDto) {
    return this.commonService.getPresignedUrl(dto.fileName);
  }

  @Post('presigned-urls')
  getPresignedUrls(@Body() dto: GetPresignedUrlsDto) {
    return this.commonService.getPresignedUrls(dto.fileNames);
  }
}
