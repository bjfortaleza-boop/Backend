import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  getAll(@Query('postId') postId?: string) {
    return this.commentsService.findAll(postId ? +postId : undefined);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.commentsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() body: { postId: number; content: string }) {
    return this.commentsService.create(req.user.userId, body.postId, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() body: { content: string }) {
    return this.commentsService.update(+id, req.user.userId, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.commentsService.remove(+id, req.user.userId);
  }
}