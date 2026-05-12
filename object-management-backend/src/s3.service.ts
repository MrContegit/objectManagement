import { Injectable } from '@nestjs/common';
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class S3Service {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = join(uploadsDir, filename);
    writeFileSync(filepath, file.buffer);
    return `/uploads/${filename}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = join(process.cwd(), filePath);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  }
}