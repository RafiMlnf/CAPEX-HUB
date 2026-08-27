import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // POST /upload
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = process.env.UPLOAD_DEST ?? './uploads';
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          // Also save clean original filename for easy retrieval
          const safeOriginal = file.originalname.replace(/[/\\?%*:|"<>]/g, '_');
          const ext = path.extname(file.originalname);
          const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          
          // Write a copy with safeOriginal name as well if needed
          const dest = process.env.UPLOAD_DEST ?? './uploads';
          try {
            if (safeOriginal) {
              const origPath = path.join(dest, safeOriginal);
              // Multer will write to name, we can also record
            }
          } catch {}
          cb(null, name);
        },
      }),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE ?? '10485760', 10),
      },
      fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.xls', '.xlsx', '.ppt', '.pptx', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext)) {
          return cb(new BadRequestException(`Format file tidak diizinkan: ${ext}`), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('bodr_id') bodrId?: string,
  ) {
    if (!file) throw new BadRequestException('File tidak ditemukan');
    
    // Save a copy under the original filename for direct downloading
    try {
      const dest = process.env.UPLOAD_DEST ?? './uploads';
      const safeOriginal = file.originalname.replace(/[/\\?%*:|"<>]/g, '_');
      const origPath = path.join(dest, safeOriginal);
      fs.copyFileSync(file.path, origPath);
    } catch {}

    return this.uploadService.uploadFile(file, bodrId);
  }

  // GET /upload/download/:filename
  @Get('download/:filename')
  downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    const dest = path.resolve(process.env.UPLOAD_DEST ?? './uploads');
    const safeFilename = path.basename(filename);
    let filePath = path.join(dest, safeFilename);

    if (!fs.existsSync(filePath)) {
      // Find matching filename
      if (fs.existsSync(dest)) {
        const files = fs.readdirSync(dest);
        const match = files.find((f) => f.toLowerCase() === safeFilename.toLowerCase() || f.includes(safeFilename));
        if (match) {
          filePath = path.join(dest, match);
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      // Fallback by extension
      const ext = path.extname(safeFilename);
      if (ext && fs.existsSync(dest)) {
        const files = fs.readdirSync(dest);
        const match = files.find((f) => path.extname(f).toLowerCase() === ext.toLowerCase());
        if (match) {
          filePath = path.join(dest, match);
        }
      }
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(safeFilename)}"`);
        return res.sendFile(filePath);
      }
      return res.download(filePath, safeFilename);
    }
    throw new NotFoundException(`Dokumen "${safeFilename}" tidak ditemukan di server.`);
  }

  // GET /upload/download?file=...
  @Get('download')
  downloadFileQuery(@Query('file') filename: string, @Res() res: Response) {
    if (!filename) throw new BadRequestException('Parameter file dibutuhkan');
    return this.downloadFile(filename, res);
  }
}
