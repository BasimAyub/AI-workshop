import { Request, Response, NextFunction } from 'express';

export interface ValidatedBook {
  title: string;
  author: string;
  genre: string;
  year: number;
  isbn?: string;
  description?: string;
}

const validateStringField = (
  value: unknown,
  name: string,
  maxLength?: number,
): string | null => {
  if (value === undefined || value === null) return `"${name}" is required`;
  if (typeof value !== 'string') return `"${name}" must be a string`;
  if (value.trim() === '') return `"${name}" must not be empty`;
  if (maxLength !== undefined && value.trim().length > maxLength)
    return `"${name}" must be at most ${maxLength} characters`;
  return null;
};

export const validateBook = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { title, author, genre, year, isbn, description } = req.body;
  const currentYear = new Date().getFullYear();

  const errors: string[] = [];

  const titleError = validateStringField(title, 'title', 200);
  if (titleError) errors.push(titleError);

  const authorError = validateStringField(author, 'author');
  if (authorError) errors.push(authorError);

  const genreError = validateStringField(genre, 'genre');
  if (genreError) errors.push(genreError);

  if (year === undefined || year === null) {
    errors.push('"year" is required');
  } else if (typeof year !== 'number' || !Number.isInteger(year)) {
    errors.push('"year" must be a number');
  } else if (year < 1000 || year > currentYear) {
    errors.push(`"year" must be between 1000 and ${currentYear}`);
  }

  if (isbn !== undefined && typeof isbn !== 'string') {
    errors.push('isbn must be a string when provided');
  }

  if (description !== undefined && typeof description !== 'string') {
    errors.push('description must be a string when provided');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Validation failed',
        details: errors,
      },
    });
  }

  req.body = {
    title: (title as string).trim(),
    author: (author as string).trim(),
    genre: (genre as string).trim(),
    year,
    isbn: typeof isbn === 'string' ? isbn.trim() : undefined,
    description:
      typeof description === 'string' ? description.trim() : undefined,
  };

  next();
};

export const validateReview = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { rating, text } = req.body;
  const errors: string[] = [];

  if (rating === undefined || rating === null) {
    errors.push('"rating" is required');
  } else if (typeof rating !== 'number') {
    errors.push('"rating" must be a number');
  } else if (rating < 1 || rating > 5) {
    errors.push('"rating" must be between 1 and 5');
  }

  const textError = validateStringField(text, 'text');
  if (textError) errors.push(textError);

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Validation failed',
        details: errors,
      },
    });
  }

  req.body = {
    rating,
    text: (text as string).trim(),
  };

  next();
};
