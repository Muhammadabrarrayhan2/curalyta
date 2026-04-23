import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../lib/errors';
import { isAllowedPublicAiImageMime } from './public-ai-upload';

export function createPublicAiImageUploadMiddleware(maxFileSizeMb: number) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSizeMb * 1024 * 1024,
      files: 1,
    },
    fileFilter: (_req, file, cb) => {
      if (isAllowedPublicAiImageMime(file.mimetype)) {
        cb(null, true);
        return;
      }

      cb(new ValidationError('Format gambar belum didukung. Gunakan JPG, PNG, atau WEBP.'));
    },
  }).single('image');

  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = String(req.headers['content-type'] || '');
    if (!contentType.includes('multipart/form-data')) {
      next();
      return;
    }

    upload(req, res, (err) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        next(new ValidationError(`Ukuran gambar terlalu besar. Maksimal ${maxFileSizeMb}MB.`));
        return;
      }

      if (err instanceof Error) {
        next(err);
        return;
      }

      next(new ValidationError('Upload gambar gagal diproses.'));
    });
  };
}
