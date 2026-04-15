import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostModel } from '../../posts/entities/post.entity';
import { UserRole } from '../const/userRole';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: '' })
  profileImageUrl?: string = '';

  @Column({ default: UserRole.USER })
  role: UserRole = UserRole.USER;

  @OneToMany(() => PostModel, (post) => post.author)
  posts: PostModel[];
}
