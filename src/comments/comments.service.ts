import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class CommentsService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async create(userId: number, postId: number, content: string) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content],
    );
    return this.findOne(result.insertId);
  }

  async findAll(postId?: number) {
    const sql = `SELECT c.id, c.post_id, c.content, c.created_at, u.username AS author
                 FROM comments c JOIN users u ON u.id = c.user_id
                 ${postId ? 'WHERE c.post_id = ?' : ''}
                 ORDER BY c.created_at DESC`;
    const [rows] = await this.pool().execute<RowDataPacket[]>(sql, postId ? [postId] : []);
    return rows;
  }

  async findOne(id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.username AS author
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException('Comment not found');
    return rows[0];
  }

  async update(id: number, userId: number, content: string) {
    const comment = await this.findOne(id);
    if (comment.user_id !== userId) throw new ForbiddenException('Not your comment');
    await this.pool().execute('UPDATE comments SET content = ? WHERE id = ?', [content, id]);
    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    const comment = await this.findOne(id);
    if (comment.user_id !== userId) throw new ForbiddenException('Not your comment');
    await this.pool().execute('DELETE FROM comments WHERE id = ?', [id]);
    return { deleted: true };
  }
}