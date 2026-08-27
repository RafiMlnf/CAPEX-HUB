import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadFile(
    file: Express.Multer.File,
    bodrId?: string,
  ): Promise<{ file_name: string; file_path: string; file_type: string }> {
    const result = {
      file_name: file.originalname,
      file_path: `/uploads/${file.filename}`,
      file_type: path.extname(file.originalname).replace('.', '').toLowerCase(),
    };

    // Register to bodr_document if bodr_id provided
    if (bodrId) {
      await this.prisma.bodrDocument.create({
        data: {
          bodr_id: parseInt(bodrId),
          file_name: result.file_name,
          file_path: result.file_path,
          file_type: result.file_type,
        },
      });
    }

    return result;
  }
}
