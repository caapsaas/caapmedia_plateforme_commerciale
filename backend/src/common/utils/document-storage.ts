import type { Request } from 'express';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

// Private files must never be placed under the Express/static server root.
export const PRIVATE_DOCUMENT_ROOT = resolve(
  process.cwd(),
  'private',
  'documents',
);
export const PRIVATE_DOCUMENT_PREFIX = '/api-caapmedia/private-documents/';

export function secretariatDestination(
  _req: Request,
  _file: Express.Multer.File,
  callback: (error: Error | null, destination: string) => void,
) {
  const destination = resolve(PRIVATE_DOCUMENT_ROOT, 'secretariat');
  try {
    mkdirSync(destination, { recursive: true, mode: 0o700 });
    callback(null, destination);
  } catch (error) {
    callback(error as Error, destination);
  }
}
