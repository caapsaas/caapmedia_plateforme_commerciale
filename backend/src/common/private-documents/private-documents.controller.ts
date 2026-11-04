import {
  Controller,
  Get,
  Param,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { PrivateDocumentsService } from './private-documents.service';

@Controller('private-documents')
@UseGuards(JwtAuthGuard)
export class PrivateDocumentsController {
  constructor(private readonly documents: PrivateDocumentsService) {}

  @Get([':category/:filename', ':category/:subsidiaryId/:filename'])
  async download(
    @Param()
    params: { category: string; filename: string; subsidiaryId?: string },
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const path = await this.documents.resolveFile(
      params.category,
      params.filename,
      params.subsidiaryId,
      req.user,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    await new Promise<void>((resolve, reject) => {
      res.download(path, params.filename, (error) =>
        error ? reject(error) : resolve(),
      );
    });
  }
}
