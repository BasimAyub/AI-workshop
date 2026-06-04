import { Router, Request, Response, NextFunction } from 'express';
import { bookService } from '../services/bookService';
import { validateBook, validateReview } from '../middleware/validation';

const router: Router = Router();

const sendError = (res: Response, status: number, message: string) =>
  res.status(status).json({ error: { status, message } });

const getQueryString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Get all books with optional filters
router.get('/books', (req: Request, res: Response) => {
  const genre = getQueryString(req.query.genre);
  const author = getQueryString(req.query.author);
  const yearParam = getQueryString(req.query.year);
  const pageParam = getQueryString(req.query.page);
  const limitParam = getQueryString(req.query.limit);

  const filters: {
    genre?: string;
    author?: string;
    year?: number;
  } = {};

  if (genre) {
    filters.genre = genre;
  }

  if (author) {
    filters.author = author;
  }

  if (yearParam !== undefined) {
    const year = Number.parseInt(yearParam, 10);

    if (Number.isNaN(year)) {
      return sendError(
        res,
        400,
        'Query parameter "year" must be a valid integer',
      );
    }

    filters.year = year;
  }

  let page = 1;
  let limit = 9;

  if (pageParam !== undefined) {
    page = Number.parseInt(pageParam, 10);
    if (Number.isNaN(page)) {
      return sendError(res, 400, 'Query parameter "page" must be a valid integer');
    }
  }

  if (limitParam !== undefined) {
    limit = Number.parseInt(limitParam, 10);
    if (Number.isNaN(limit)) {
      return sendError(res, 400, 'Query parameter "limit" must be a valid integer');
    }
  }

  res.json(bookService.getAllBooks(filters, { page, limit }));
});

// Search books (must be registered before /books/:id)
router.get('/books/search', (req: Request, res: Response) => {
  const query = getQueryString(req.query.q);
  const pageParam = getQueryString(req.query.page);
  const limitParam = getQueryString(req.query.limit);

  if (!query) {
    return sendError(res, 400, 'Query parameter "q" is required');
  }

  let page = 1;
  let limit = 9;

  if (pageParam !== undefined) {
    page = Number.parseInt(pageParam, 10);
    if (Number.isNaN(page)) {
      return sendError(res, 400, 'Query parameter "page" must be a valid integer');
    }
  }

  if (limitParam !== undefined) {
    limit = Number.parseInt(limitParam, 10);
    if (Number.isNaN(limit)) {
      return sendError(res, 400, 'Query parameter "limit" must be a valid integer');
    }
  }

  res.json(bookService.searchBooks(query, { page, limit }));
});

// Get rating summary for a book
router.get('/books/:id/rating-summary', (req: Request, res: Response) => {
  const summary = bookService.getRatingSummary(req.params.id);

  if (!summary) {
    return sendError(res, 404, 'Book not found');
  }

  res.json(summary);
});

// Get a single book by ID with reviews
router.get('/books/:id', (req: Request, res: Response) => {
  const book = bookService.getBookById(req.params.id);

  if (!book) {
    return sendError(res, 404, 'Book not found');
  }

  res.json(book);
});

// Update a book by ID
router.put(
  '/books/:id',
  validateBook,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = bookService.updateBook(req.params.id, req.body);
      if (!updated) {
        return sendError(res, 404, 'Book not found');
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

// Delete a book by ID
router.delete('/books/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = bookService.deleteBook(req.params.id);

    if (!deleted) {
      return sendError(res, 404, 'Book not found');
    }

    res.json(deleted);
  } catch (error) {
    next(error);
  }
});

// Get all reviews for a book
router.get('/books/:id/reviews', (req: Request, res: Response) => {
  const reviews = bookService.getBookReviews(req.params.id);
  if (!reviews) {
    return sendError(res, 404, 'Book not found');
  }
  res.json(reviews);
});

// Add a review to a book
router.post(
  '/books/:id/reviews',
  validateReview,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = bookService.createReview(req.params.id, req.body);
      if (!review) {
        return sendError(res, 404, 'Book not found');
      }
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  },
);

// Create a new book
router.post(
  '/books',
  validateBook,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const newBook = bookService.createBook(req.body);
      res.status(201).json(newBook);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
