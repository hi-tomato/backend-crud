import { PickType } from '@nestjs/mapped-types';
import { PostDto } from './post-dto';

export class CreatePostDto extends PickType(PostDto, [
  'title',
  'content',
  'imagePath',
]) {}
