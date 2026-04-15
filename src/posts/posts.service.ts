import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
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
    // ! Case1: 작성한 포스트를 페이지네이션 처리하여 반환하는 방식
    return this.commonService.paginate<PostModel>(dto, this.postsRepository, {
      author: true,
    });
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
