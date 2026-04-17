import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { GetPresignedUrlDto } from './dto/presigned-url.dto';
import { GetPresignedUrlsDto } from './dto/presigned-urls.dto';
import { UploadService } from './upload.service';

@Controller('common')
export class CommonController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadImage(file);
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('images', 5))
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadImages(files);
  }

  @Post('presigned-url')
  getPresignedUrl(@Body() dto: GetPresignedUrlDto) {
    return this.uploadService.getPresignedUrl(dto.fileName);
  }

  @Post('presigned-urls')
  getPresignedUrls(@Body() dto: GetPresignedUrlsDto) {
    return this.uploadService.getPresignedUrls(dto.fileNames);
  }
}
