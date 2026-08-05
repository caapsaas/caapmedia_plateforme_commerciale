import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface FileUploadOptions {
  subfolder?: string;
  maxSizeMb?: number;
  allowedMimes?: string[];
}

@Injectable()
export class FileUploadService {
  private readonly publicPath = path.join(__dirname, '..', '..', '..', '..', 'public');

  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    options: FileUploadOptions = {},
  ): Promise<{ url: string; filename: string }> {
    const {
      subfolder = 'uploads',
      maxSizeMb = 10,
      allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg',
      ],
    } = options;

    // Validate file size
    if (buffer.length > maxSizeMb * 1024 * 1024) {
      throw new BadRequestException(
        `File size exceeds ${maxSizeMb}MB limit`,
      );
    }

    // Extract MIME type from buffer if not provided
    const mimeType = this.getMimeType(buffer, originalFilename);
    if (!allowedMimes.includes(mimeType)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedMimes.join(', ')}`,
      );
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(this.publicPath, subfolder);
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(originalFilename);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file to disk
    await fs.writeFile(filepath, buffer);

    // Return public URL
    const url = `/public/${subfolder}/${filename}`;
    return { url, filename };
  }

  async deleteFile(url: string): Promise<void> {
    if (!url) return;

    try {
      // Extract filename from URL
      const urlPath = url.replace('/public/', '');
      const filepath = path.join(this.publicPath, urlPath);

      // Security check: ensure the file is within public directory
      const realPath = await fs.realpath(filepath);
      const publicRealPath = await fs.realpath(this.publicPath);

      if (!realPath.startsWith(publicRealPath)) {
        throw new BadRequestException('Invalid file path');
      }

      await fs.unlink(filepath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private getMimeType(buffer: Buffer, filename: string): string {
    // Simple MIME type detection based on file extension and magic bytes
    const ext = path.extname(filename).toLowerCase();

    // Magic bytes detection
    if (buffer.length > 4) {
      const magicBytes = buffer.slice(0, 4);

      // PDF: %PDF
      if (magicBytes[0] === 0x25 && magicBytes[1] === 0x50 && magicBytes[2] === 0x44 && magicBytes[3] === 0x46) {
        return 'application/pdf';
      }

      // JPEG: FF D8 FF
      if (magicBytes[0] === 0xff && magicBytes[1] === 0xd8 && magicBytes[2] === 0xff) {
        return 'image/jpeg';
      }

      // PNG: 89 50 4E 47
      if (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4e && magicBytes[3] === 0x47) {
        return 'image/png';
      }
    }

    // Fallback to extension-based detection
    const extMimeMap: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };

    return extMimeMap[ext] || 'application/octet-stream';
  }
}
