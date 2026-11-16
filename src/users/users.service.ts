import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async findAll() {
    const [rows]: any = await this.db.pool.query('SELECT id, username, role FROM users');
    return rows;
  }

  async findById(id: number) {
    const [rows]: any = await this.db.pool.query(
      'SELECT id, username, role FROM users WHERE id = ?', [id]);
    if (!rows[0]) throw new NotFoundException('User not found');
    return rows[0];
  }

  async findByUsername(username: string) {
    const [rows]: any = await this.db.pool.query(
      'SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] ?? null;
  }

  async createUser(username: string, password: string, role = 'student') {
    const exists = await this.findByUsername(username);
    if (exists) throw new ConflictException('Username already exists');
    const hash = await bcrypt.hash(password, 10);
    const [result]: any = await this.db.pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hash, role]);
    return { id: result.insertId, username, role };
  }

  async update(id: number, body: { username?: string; password?: string; role?: string }) {
    const current = await this.findById(id);
    const username = body.username ?? current.username;
    const role = body.role ?? current.role;
    if (body.password) {
      const hash = await bcrypt.hash(body.password, 10);
      await this.db.pool.query(
        'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?',
        [username, hash, role, id]);
    } else {
      await this.db.pool.query(
        'UPDATE users SET username = ?, role = ? WHERE id = ?', [username, role, id]);
    }
    return { id, username, role };
  }

  async remove(id: number) {
    await this.findById(id);
    await this.db.pool.query('DELETE FROM users WHERE id = ?', [id]);
    return { message: `User ${id} deleted` };
  }
}