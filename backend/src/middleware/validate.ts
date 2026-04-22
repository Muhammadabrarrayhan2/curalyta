import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Validates a request segment against a Zod schema. Replaces the segment
 * with the parsed value so downstream handlers get proper types.
 */
export function validate<T>(schema: ZodSchema<T>, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      return next(result.error);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[source] = result.data;
    next();
  };
}
