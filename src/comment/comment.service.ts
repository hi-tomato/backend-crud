import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_CODES } from '../common/const/error-codes';
import { assertFound, assertOwner } from '../common/utils/assert';
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
    assertFound(
      await this.postRepository.findOne({ where: { id: postId } }),
      ERROR_CODES.POST.NOT_FOUND,
    );

    const comment = this.commentRepository.create({
      content: dto.content,
      post: { id: postId },
      author: { id: userId },
    });

    return this.commentRepository.save(comment);
  }

  getCommentById(id: number) {
    return this.commentRepository.findOne({
      where: { id, isDeleted: false },
      relations: { author: true, post: true },
    });
  }

  async updateComment(id: number, dto: UpdateCommentDto, userId: number) {
    const comment = assertFound(
      await this.commentRepository.findOne({
        where: { id, isDeleted: false },
        relations: { author: true },
      }),
      ERROR_CODES.COMMENT.NOT_FOUND,
    );

    assertOwner(comment.author.id, userId, ERROR_CODES.COMMENT.FORBIDDEN);

    this.commentRepository.merge(comment, dto);

    return this.commentRepository.save(comment);
  }

  async deleteComment(id: number, userId: number) {
    const comment = assertFound(
      await this.commentRepository.findOne({
        where: { id, isDeleted: false },
        relations: { author: true },
      }),
      ERROR_CODES.COMMENT.NOT_FOUND,
    );

    assertOwner(comment.author.id, userId, ERROR_CODES.COMMENT.FORBIDDEN);

    await this.commentRepository.update(id, { isDeleted: true });

    return { message: 'Comment deleted successfully' };
  }
}
