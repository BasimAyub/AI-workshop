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

export const validateList = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, description } = req.body;
  const errors: string[] = [];

  if (name === undefined || name === null) {
    errors.push('"name" is required');
  } else if (typeof name !== 'string') {
    errors.push('"name" must be a string');
  } else if (name.trim() === '') {
    errors.push('"name" must not be empty');
  }

  if (description !== undefined && typeof description !== 'string') {
    errors.push('"description" must be a string');
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
    name: (name as string).trim(),
    description: typeof description === 'string' ? description.trim() : undefined,
  };

  next();
};

export const validateListBook = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { bookId, action } = req.body;
  const errors: string[] = [];

  if (bookId === undefined || bookId === null) {
    errors.push('"bookId" is required');
  } else if (typeof bookId !== 'string') {
    errors.push('"bookId" must be a string');
  } else if (bookId.trim() === '') {
    errors.push('"bookId" must not be empty');
  }

  if (action === undefined || action === null) {
    errors.push('"action" is required');
  } else if (action !== 'add' && action !== 'remove') {
    errors.push('"action" must be "add" or "remove"');
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
    bookId: (bookId as string).trim(),
    action,
  };

  next();
};

export const validateUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { displayName, avatarUrl, favoriteGenres } = req.body;
  const errors: string[] = [];

  const displayNameError = validateStringField(displayName, 'displayName', 100);
  if (displayNameError) errors.push(displayNameError);

  if (avatarUrl !== undefined && typeof avatarUrl !== 'string') {
    errors.push('"avatarUrl" must be a string when provided');
  }

  if (favoriteGenres !== undefined) {
    if (!Array.isArray(favoriteGenres)) {
      errors.push('"favoriteGenres" must be an array when provided');
    } else if (favoriteGenres.some((g) => typeof g !== 'string' || g.trim() === '')) {
      errors.push('"favoriteGenres" must be an array of non-empty strings');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: { status: 400, message: 'Validation failed', details: errors },
    });
  }

  req.body = {
    displayName: (displayName as string).trim(),
    avatarUrl: typeof avatarUrl === 'string' ? avatarUrl.trim() : undefined,
    favoriteGenres: Array.isArray(favoriteGenres)
      ? (favoriteGenres as string[]).map((g) => g.trim())
      : undefined,
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
