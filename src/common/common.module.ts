import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';

@Module({
  imports: [
    MulterModule.register({
      fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

        const ext = extname(file.originalname).toLowerCase();

        if (
          !file.mimetype.startsWith('image/') ||
          !allowedExtensions.includes(ext)
        ) {
          return cb(
            new BadRequestException('지원하지 않는 파일 형식입니다.'),
            false,
          );
        }

        cb(null, true);
      },

      limits: {
        fileSize: 1024 * 1024 * 5,
      },

      storage: diskStorage({
        destination: './public/images',
        filename: (req, file, cb) => {
          if (!file) {
            return cb(
              new Error('File is Required'),
              '파일이 존재하지 않습니다.',
            );
          }

          const fileName = randomUUID() + extname(file.originalname);
          cb(null, fileName);
        },
      }),
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
