import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostModel } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/user.entity';

/**
 * 1. 댓글의 작성자 (1:N)
 * 2. 댓글 내용
 * 3. 작성된 포스트
 * 3. 작성한 날짜
 * 4. 수정한 날짜
 * 5. 삭제 여부
 */

@Entity()
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.comments)
  author: User;

  @ManyToOne(() => PostModel, (post) => post.comments)
  post: PostModel;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;
}
