import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PostsService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: number, title: string, content: string) {
    const [result]: any = await this.db.pool.query(
      'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
      [userId, title, content],
    );
    return this.findOne(result.insertId);
  }

  async findAll() {
    const [rows]: any = await this.db.pool.query(
      'SELECT * FROM posts ORDER BY created_at DESC',
    );
    return rows;
  }

  async findOne(id: number) {
    const [rows]: any = await this.db.pool.query(
      'SELECT * FROM posts WHERE id = ?',
      [id],
    );
    if (!rows[0]) throw new NotFoundException('Post not found');
    return rows[0];
  }

  async update(id: number, userId: number, title: string, content: string) {
    const post = await this.findOne(id);
    if (post.user_id !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }
    await this.db.pool.query(
      'UPDATE posts SET title = ?, content = ? WHERE id = ?',
      [title, content, id],
    );
    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    const post = await this.findOne(id);
    if (post.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.db.pool.query('DELETE FROM posts WHERE id = ?', [id]);
    return { deleted: true };
  }
}