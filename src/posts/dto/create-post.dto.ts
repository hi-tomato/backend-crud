import { PickType } from '@nestjs/swagger';
import { PostDto } from './post-dto';

export class CreatePostDto extends PickType(PostDto, [
  'title',
  'content',
  'imagePath',
]) {}
