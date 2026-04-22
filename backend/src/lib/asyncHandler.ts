import type { Request, Response, NextFunction } from 'express';

type Handler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<unknown> | unknown;

/**
 * Wraps async route handlers so thrown errors propagate to Express's
 * error middleware instead of crashing the server.
 */
export function asyncHandler<Req extends Request = Request>(fn: Handler<Req>) {
  return (req: Req, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
