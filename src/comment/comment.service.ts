import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostModel } from '../posts/entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentEntity } from './entities/comment.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(PostModel)
    private readonly postRepository: Repository<PostModel>,
  ) {}

  async createComment(postId: number, dto: CreateCommentDto, userId: number) {
    const post = await this.postRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (post === null) {
      throw new NotFoundException('Post not found');
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      post: {
        id: postId,
      },
      author: {
        id: userId,
      },
    });

    return this.commentRepository.save(comment);
  }

  getCommentById(id: number) {
    return this.commentRepository.findOne({
      where: { id },
      relations: {
        author: true,
        post: true,
      },
    });
  }

  async updateComment(id: number, dto: UpdateCommentDto, userId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException('You are not the author of this comment');
    }

    this.commentRepository.merge(comment, dto);

    return this.commentRepository.save(comment);
  }

  async deleteComment(id: number, userId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException('You are not the author of this comment');
    }

    await this.commentRepository.update(id, { isDeleted: true });

    return { message: 'Comment deleted successfully' };
  }
}
