import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const errorHandler = (
  err: Error & { status?: number; type?: string },
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Invalid JSON in request body',
      },
    });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${status}: ${message}`);

  res.status(status).json({
    error: {
      status,
      message,
    },
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: {
      status: 404,
      message: 'Not Found',
    },
  });
};
