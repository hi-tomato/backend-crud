import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ERROR_MESSAGES } from './const/error-messages';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('MINIO_REGION'),
      endpoint: this.configService.get<string>('MINIO_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ACCESS_KEY') || '',
        secretAccessKey:
          this.configService.get<string>('MINIO_SECRET_KEY') || '',
      },
      forcePathStyle: true,
    });
  }

  uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(ERROR_MESSAGES.COMMON.FILE_NOT_FOUND);
    }

    return {
      imageUrl: `${this.configService.get('PROTOCOL')}://${this.configService.get('HOST')}/public/images/${file.filename}`,
    };
  }

  uploadImages(files: Express.Multer.File[]) {
    return {
      imageUrls: files.map(
        (file) =>
          `${this.configService.get('PROTOCOL')}://${this.configService.get('HOST')}/public/images/${file.filename}`,
      ),
    };
  }

  async getPresignedUrl(fileName: string) {
    const uniqueFileName = randomUUID() + extname(fileName);

    const command = new PutObjectCommand({
      Bucket: this.configService.get<string>('MINIO_BUCKET'),
      Key: uniqueFileName,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
    });

    return {
      presignedUrl: signedUrl,
      key: uniqueFileName,
    };
  }

  async getPresignedUrls(fileNames: string[]) {
    return Promise.all(
      fileNames.map((fileName) => this.getPresignedUrl(fileName)),
    );
  }
}
