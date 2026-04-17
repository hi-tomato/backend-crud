import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../common/const/error-messages';
import { CursorPaginationDto } from '../common/dto/cursor-pagination.dto';
import { OffsetPaginationDto } from '../common/dto/offset-pagination.dto';
import { PaginationService } from '../common/pagination.service';
import { assertFound, assertOwner } from '../common/utils/assert';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostModel } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostModel)
    private readonly postsRepository: Repository<PostModel>,
    private readonly paginationService: PaginationService,
  ) {}

  private async findPostOrFail(postId: number): Promise<PostModel> {
    return assertFound(
      await this.postsRepository.findOne({
        where: { id: postId },
        relations: { author: true },
      }),
      ERROR_MESSAGES.POST.NOT_FOUND,
    );
  }

  async createPost(authorId: number, dto: CreatePostDto) {
    const newPost = this.postsRepository.create({
      ...dto,
      author: { id: authorId },
    });

    return await this.postsRepository.save(newPost);
  }

  getPosts(dto: OffsetPaginationDto) {
    return this.paginationService.paginate<PostModel>(
      dto,
      this.postsRepository,
      { author: true },
    );
  }

  getPostsCursor(dto: CursorPaginationDto) {
    return this.paginationService.cursorPaginate<PostModel>(
      dto,
      this.postsRepository,
      ['author'],
    );
  }

  getPostById(postId: number) {
    return this.findPostOrFail(postId);
  }

  async updatePostById(postId: number, authorId: number, dto: UpdatePostDto) {
    const post = await this.findPostOrFail(postId);

    assertOwner(post.author.id, authorId, ERROR_MESSAGES.POST.FORBIDDEN);

    const updatedPost = this.postsRepository.merge(post, dto);

    return await this.postsRepository.save(updatedPost);
  }

  async deletePostById(postId: number, authorId: number) {
    const post = await this.findPostOrFail(postId);

    assertOwner(post.author.id, authorId, ERROR_MESSAGES.POST.FORBIDDEN);

    return await this.postsRepository.delete(postId);
  }
}
