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
    const originalName = file.originalname;
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const filename = `${Date.now()}-${sanitizedName}`;
    const filepath = join(uploadsDir, filename);
    writeFileSync(filepath, file.buffer);
    return `/uploads/${filename}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = join(process.cwd(), relativePath);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  }
}