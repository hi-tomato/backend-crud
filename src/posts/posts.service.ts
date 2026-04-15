import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { CursorPaginationDto } from '../common/dto/cursor-pagination.dto';
import { OffsetPaginationDto } from '../common/dto/offset-pagination.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostModel } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostModel)
    private readonly postsRepository: Repository<PostModel>,
    private readonly commonService: CommonService,
  ) {}

  async createPost(authorId: number, dto: CreatePostDto) {
    const newPost = this.postsRepository.create({
      ...dto,
      author: { id: authorId },
    });

    return await this.postsRepository.save(newPost);
  }

  getPosts(dto: OffsetPaginationDto) {
    return this.commonService.paginate<PostModel>(dto, this.postsRepository, {
      author: true,
    });
  }

  getPostsCursor(dto: CursorPaginationDto) {
    return this.commonService.cursorPaginate<PostModel>(
      dto,
      this.postsRepository,
      ['author'],
    );
  }

  getPostById(postId: number) {
    return this.postsRepository.findOne({
      where: { id: postId },
      relations: { author: true },
    });
  }

  async updatePostById(postId: number, authorId: number, dto: UpdatePostDto) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: { author: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.id !== authorId) {
      throw new ForbiddenException('You are not the author of this post');
    }

    Object.assign(post, dto);

    return await this.postsRepository.save(post);
  }

  async deletePostById(postId: number, authorId: number) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: { author: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.id !== authorId) {
      throw new ForbiddenException('You are not the author of this post');
    }

    return await this.postsRepository.delete(postId);
  }
}
