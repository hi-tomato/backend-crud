import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CommonService } from './common.service';

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
}
