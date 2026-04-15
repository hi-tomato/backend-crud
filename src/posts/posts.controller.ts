import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CursorPaginationDto } from '../common/dto/cursor-pagination.dto';
import { OffsetPaginationDto } from '../common/dto/offset-pagination.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  createPost(@Body() dto: CreatePostDto, @CurrentUser() user: JwtPayload) {
    return this.postsService.createPost(user.userId, dto);
  }

  @Get('cursor')
  getPostsCursor(@Query() dto: CursorPaginationDto) {
    return this.postsService.getPostsCursor(dto);
  }

  @Get(':id')
  getPostById(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  @Get()
  getPosts(@Query() dto: OffsetPaginationDto) {
    return this.postsService.getPosts(dto);
  }

  @Patch(':id')
  updatePostById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.postsService.updatePostById(id, user.userId, dto);
  }

  @Delete(':id')
  deletePostById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.postsService.deletePostById(id, user.userId);
  }
}
