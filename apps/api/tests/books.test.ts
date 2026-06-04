import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import bookRoutes from '../src/routes/books';
import { errorHandler, ApiError } from '../src/middleware/errorHandler';
import { bookService } from '../src/services/bookService';

jest.mock('../src/services/bookService');

const app = express();
app.use(express.json());
app.use('/api', bookRoutes);
app.use(errorHandler);

const mockedBookService = bookService as jest.Mocked<typeof bookService>;

describe('API Tests', () => {
  describe('GET /api/health', () => {
    it('should return ok status', () => {
      // Test implementation
    });
  });

  describe('GET /api/books', () => {
    it('should return all books', () => {
      // Test implementation
    });

    it('should filter books by genre', () => {
      // Test implementation
    });
  });

  describe('GET /api/books/search', () => {
    const bookFixtures = [
      {
        id: 'book_001',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Fiction',
        year: 1925,
        isbn: '',
        description: '',
        coverUrl: null,
        addedAt: '2026-06-03T00:00:00.000Z',
      },
      {
        id: 'book_002',
        title: 'Tender Is the Night',
        author: 'F. Scott Fitzgerald',
        genre: 'Fiction',
        year: 1934,
        isbn: '',
        description: '',
        coverUrl: null,
        addedAt: '2026-06-03T00:00:00.000Z',
      },
      {
        id: 'book_003',
        title: 'Dune',
        author: 'Frank Herbert',
        genre: 'Science Fiction',
        year: 1965,
        isbn: '',
        description: '',
        coverUrl: null,
        addedAt: '2026-06-03T00:00:00.000Z',
      },
    ];

    const paginatedResult = (
      data = bookFixtures,
      page = 1,
      total = bookFixtures.length,
    ) => ({
      data,
      total,
      page,
      totalPages: Math.ceil(total / 9) || 1,
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should find books matching a title', async () => {
      // Arrange
      const match = [bookFixtures[0]];
      mockedBookService.searchBooks.mockReturnValue(
        paginatedResult(match, 1, 1),
      );

      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: 'Gatsby' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('The Great Gatsby');
      expect(mockedBookService.searchBooks).toHaveBeenCalledWith('Gatsby', {
        page: 1,
        limit: 9,
      });
    });

    it('should find books matching an author name', async () => {
      // Arrange
      const fitzBooks = bookFixtures.slice(0, 2);
      mockedBookService.searchBooks.mockReturnValue(
        paginatedResult(fitzBooks, 1, 2),
      );

      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: 'Fitzgerald' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('should find books matching a genre', async () => {
      // Arrange
      mockedBookService.searchBooks.mockReturnValue(
        paginatedResult(bookFixtures, 1, 3),
      );

      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: 'Fiction' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });

    it('should perform case-insensitive search', async () => {
      // Arrange
      const match = [bookFixtures[0]];
      mockedBookService.searchBooks.mockReturnValue(
        paginatedResult(match, 1, 1),
      );

      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: 'gatsby' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data[0].title).toBe('The Great Gatsby');
      expect(mockedBookService.searchBooks).toHaveBeenCalledWith('gatsby', {
        page: 1,
        limit: 9,
      });
    });

    it('should find books on a partial match', async () => {
      // Arrange
      const fitzBooks = bookFixtures.slice(0, 2);
      mockedBookService.searchBooks.mockReturnValue(
        paginatedResult(fitzBooks, 1, 2),
      );

      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: 'fitz' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('should return empty results when no books match', async () => {
      // Arrange
      mockedBookService.searchBooks.mockReturnValue(paginatedResult([], 1, 0));

      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: 'xyznotabook' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('should return 400 when q is missing', async () => {
      // Act
      const res = await request(app).get('/api/books/search');

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/q.*required/i);
    });

    it('should return 400 when q is an empty string', async () => {
      // Act
      const res = await request(app).get('/api/books/search').query({ q: '' });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/q.*required/i);
    });

    it('should return 400 when q is whitespace only', async () => {
      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: '   ' });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/q.*required/i);
    });

    it('should return paginated results with correct shape', async () => {
      // Arrange
      mockedBookService.searchBooks.mockReturnValue({
        data: bookFixtures,
        total: 27,
        page: 1,
        totalPages: 3,
      });

      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: 'fiction' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: expect.any(Array),
        total: 27,
        page: 1,
        totalPages: 3,
      });
    });

    it('should pass page and limit to the service', async () => {
      // Arrange
      mockedBookService.searchBooks.mockReturnValue(
        paginatedResult([bookFixtures[2]], 2, 3),
      );

      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: 'fiction', page: '2', limit: '1' });

      // Assert
      expect(res.status).toBe(200);
      expect(mockedBookService.searchBooks).toHaveBeenCalledWith('fiction', {
        page: 2,
        limit: 1,
      });
    });

    it('should return 400 when page is not an integer', async () => {
      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: 'gatsby', page: 'two' });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/page.*valid integer/i);
    });

    it('should return 400 when limit is not an integer', async () => {
      // Act
      const res = await request(app)
        .get('/api/books/search')
        .query({ q: 'gatsby', limit: 'ten' });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/limit.*valid integer/i);
    });
  });

  describe('POST /api/books', () => {
    const validBook = {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      genre: 'Fiction',
      year: 1925,
    };

    const createdBook = {
      id: 'book_abc123',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      genre: 'Fiction',
      year: 1925,
      isbn: '',
      description: '',
      coverUrl: null,
      addedAt: '2026-06-03T00:00:00.000Z',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a new book', async () => {
      // Arrange
      mockedBookService.createBook.mockReturnValue(createdBook);

      // Act
      const res = await request(app).post('/api/books').send(validBook);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.stringContaining('book_'),
        title: validBook.title,
        author: validBook.author,
        genre: validBook.genre,
        year: validBook.year,
      });
      expect(mockedBookService.createBook).toHaveBeenCalledWith(validBook);
    });

    it('should validate required fields', async () => {
      // Act
      const res = await request(app).post('/api/books').send({});

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.stringContaining('title'),
          expect.stringContaining('author'),
          expect.stringContaining('genre'),
          expect.stringContaining('year'),
        ]),
      );
    });

    it('should return 400 when title is missing', async () => {
      // Arrange
      const { title: _title, ...bookWithoutTitle } = validBook;

      // Act
      const res = await request(app).post('/api/books').send(bookWithoutTitle);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"title" is required');
    });

    it('should return 400 when author is missing', async () => {
      // Arrange
      const { author: _author, ...bookWithoutAuthor } = validBook;

      // Act
      const res = await request(app).post('/api/books').send(bookWithoutAuthor);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"author" is required');
    });

    it('should return 400 when genre is missing', async () => {
      // Arrange
      const { genre: _genre, ...bookWithoutGenre } = validBook;

      // Act
      const res = await request(app).post('/api/books').send(bookWithoutGenre);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"genre" is required');
    });

    it('should return 400 when year is missing', async () => {
      // Arrange
      const { year: _year, ...bookWithoutYear } = validBook;

      // Act
      const res = await request(app).post('/api/books').send(bookWithoutYear);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"year" is required');
    });

    it('should return 400 when year is below 1000', async () => {
      // Act
      const res = await request(app)
        .post('/api/books')
        .send({ ...validBook, year: 999 });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatch(/year.*between 1000/);
    });

    it('should return 400 when year exceeds the current year', async () => {
      // Act
      const res = await request(app)
        .post('/api/books')
        .send({ ...validBook, year: 9999 });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatch(/year.*between 1000/);
    });

    it('should return 400 when year is not a number', async () => {
      // Act
      const res = await request(app)
        .post('/api/books')
        .send({ ...validBook, year: 'nineteen twenty-five' });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"year" must be a number');
    });

    it('should return 400 when title exceeds 200 characters', async () => {
      // Arrange
      const longTitle = 'A'.repeat(201);

      // Act
      const res = await request(app)
        .post('/api/books')
        .send({ ...validBook, title: longTitle });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatch(
        /"title" must be at most 200 characters/,
      );
    });

    it('should return 400 when title is an empty string', async () => {
      // Act
      const res = await request(app)
        .post('/api/books')
        .send({ ...validBook, title: '   ' });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"title" must not be empty');
    });

    it('should accept optional isbn and description', async () => {
      // Arrange
      const bookWithOptionals = {
        ...validBook,
        isbn: '978-3-16-148410-0',
        description: 'A classic novel.',
      };
      mockedBookService.createBook.mockReturnValue({
        ...createdBook,
        isbn: bookWithOptionals.isbn,
        description: bookWithOptionals.description,
      });

      // Act
      const res = await request(app).post('/api/books').send(bookWithOptionals);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        isbn: bookWithOptionals.isbn,
        description: bookWithOptionals.description,
      });
    });
  });

  describe('POST /api/books/:id/reviews', () => {
    const bookId = 'book_mpv2br89vfs5bj';
    const validReview = { rating: 4, text: 'A wonderful read.' };
    const createdReview = {
      id: 'review_abc123',
      bookId,
      userId: '',
      rating: 4,
      text: 'A wonderful read.',
      createdAt: '2026-06-04T00:00:00.000Z',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a review and return it with status 201', async () => {
      // Arrange
      mockedBookService.createReview.mockReturnValue(createdReview);

      // Act
      const res = await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send(validReview);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.stringContaining('review_'),
        bookId,
        rating: validReview.rating,
        text: validReview.text,
      });
      expect(mockedBookService.createReview).toHaveBeenCalledWith(
        bookId,
        validReview,
      );
    });

    it('should return 404 when the book does not exist', async () => {
      // Arrange
      mockedBookService.createReview.mockReturnValue(null);

      // Act
      const res = await request(app)
        .post('/api/books/book_doesnotexist/reviews')
        .send(validReview);

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Book not found');
    });

    it('should return 500 when the write fails', async () => {
      // Arrange
      mockedBookService.createReview.mockImplementation(() => {
        throw new ApiError(500, 'Failed to save review');
      });

      // Act
      const res = await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send(validReview);

      // Assert
      expect(res.status).toBe(500);
      expect(res.body.error.message).toBe('Failed to save review');
    });

    it('should return 400 when rating is missing', async () => {
      const res = await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send({ text: 'Great book.' });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"rating" is required');
    });

    it('should return 400 when rating is not a number', async () => {
      const res = await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send({ ...validReview, rating: 'five' });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"rating" must be a number');
    });

    it('should return 400 when rating is below 1', async () => {
      const res = await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send({ ...validReview, rating: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatch(/rating.*between 1 and 5/);
    });

    it('should return 400 when rating exceeds 5', async () => {
      const res = await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send({ ...validReview, rating: 6 });

      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatch(/rating.*between 1 and 5/);
    });

    it('should return 400 when text is missing', async () => {
      const res = await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send({ rating: 3 });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"text" is required');
    });

    it('should return 400 when text is empty', async () => {
      const res = await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send({ ...validReview, text: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"text" must not be empty');
    });
  });

  describe('GET /api/books/:id/rating-summary', () => {
    const bookId = 'book_mpv2br89vfs5bj';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return rating summary with averageRating and totalReviews', async () => {
      mockedBookService.getRatingSummary.mockReturnValue({
        bookId,
        averageRating: 4.5,
        totalReviews: 2,
      });

      const res = await request(app).get(`/api/books/${bookId}/rating-summary`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ bookId, averageRating: 4.5, totalReviews: 2 });
      expect(mockedBookService.getRatingSummary).toHaveBeenCalledWith(bookId);
    });

    it('should return averageRating 0 and totalReviews 0 when the book has no reviews', async () => {
      mockedBookService.getRatingSummary.mockReturnValue({
        bookId,
        averageRating: 0,
        totalReviews: 0,
      });

      const res = await request(app).get(`/api/books/${bookId}/rating-summary`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ bookId, averageRating: 0, totalReviews: 0 });
    });

    it('should return 404 when the book does not exist', async () => {
      mockedBookService.getRatingSummary.mockReturnValue(null);

      const res = await request(app).get('/api/books/book_doesnotexist/rating-summary');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Book not found');
    });
  });

  describe('DELETE /api/books/:id', () => {
    const bookFixture = {
      id: 'book_mpv2br89vfs5bj',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      genre: 'Fiction',
      year: 1925,
      isbn: '',
      description: '',
      coverUrl: null,
      addedAt: '2026-06-03T00:00:00.000Z',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return the deleted book with status 200', async () => {
      mockedBookService.deleteBook.mockReturnValue(bookFixture);

      const res = await request(app).delete(`/api/books/${bookFixture.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(bookFixture);
      expect(mockedBookService.deleteBook).toHaveBeenCalledWith(bookFixture.id);
    });

    it('should return 404 when the book does not exist', async () => {
      mockedBookService.deleteBook.mockReturnValue(null);

      const res = await request(app).delete('/api/books/book_doesnotexist');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Book not found');
    });

    it('should return 500 when the service throws an ApiError', async () => {
      mockedBookService.deleteBook.mockImplementation(() => {
        throw new ApiError(500, 'Failed to delete book');
      });

      const res = await request(app).delete(`/api/books/${bookFixture.id}`);

      expect(res.status).toBe(500);
      expect(res.body.error.message).toBe('Failed to delete book');
    });
  });

  describe('GET /api/books/:id/reviews', () => {
    const bookId = 'book_mpv2br89vfs5bj';
    const reviewFixtures = [
      {
        id: 'review_abc123',
        bookId,
        userId: '',
        rating: 4,
        text: 'A wonderful read.',
        createdAt: '2026-06-04T00:00:00.000Z',
      },
      {
        id: 'review_def456',
        bookId,
        userId: '',
        rating: 5,
        text: 'A masterpiece.',
        createdAt: '2026-06-04T00:00:00.000Z',
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return all reviews for an existing book', async () => {
      mockedBookService.getBookReviews.mockReturnValue(reviewFixtures);

      const res = await request(app).get(`/api/books/${bookId}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({ id: 'review_abc123', bookId, rating: 4 });
      expect(mockedBookService.getBookReviews).toHaveBeenCalledWith(bookId);
    });

    it('should return an empty array when the book has no reviews', async () => {
      mockedBookService.getBookReviews.mockReturnValue([]);

      const res = await request(app).get(`/api/books/${bookId}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 404 when the book does not exist', async () => {
      mockedBookService.getBookReviews.mockReturnValue(null);

      const res = await request(app).get('/api/books/book_doesnotexist/reviews');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Book not found');
    });
  });

  describe('PUT /api/books/:id', () => {
    const bookFixture = {
      id: 'book_mpv2br89vfs5bj',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      genre: 'Fiction',
      year: 1925,
      isbn: '',
      description: '',
      coverUrl: null,
      addedAt: '2026-06-03T00:00:00.000Z',
    };

    const validPayload = {
      title: 'The Great Gatsby Updated',
      author: 'F. Scott Fitzgerald',
      genre: 'Classic Fiction',
      year: 1925,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update a book and return it with status 200', async () => {
      const updatedBook = { ...bookFixture, ...validPayload };
      mockedBookService.updateBook.mockReturnValue(updatedBook);

      const res = await request(app)
        .put(`/api/books/${bookFixture.id}`)
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: bookFixture.id, title: validPayload.title, genre: validPayload.genre });
      expect(mockedBookService.updateBook).toHaveBeenCalledWith(bookFixture.id, validPayload);
    });

    it('should return 404 when the book does not exist', async () => {
      mockedBookService.updateBook.mockReturnValue(null);

      const res = await request(app)
        .put('/api/books/book_doesnotexist')
        .send(validPayload);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Book not found');
    });

    it('should return 500 when the write fails', async () => {
      mockedBookService.updateBook.mockImplementation(() => {
        throw new ApiError(500, 'Failed to update book');
      });

      const res = await request(app)
        .put(`/api/books/${bookFixture.id}`)
        .send(validPayload);

      expect(res.status).toBe(500);
      expect(res.body.error.message).toBe('Failed to update book');
    });

    it('should return 400 when title is missing', async () => {
      const { title: _title, ...withoutTitle } = validPayload;

      const res = await request(app)
        .put(`/api/books/${bookFixture.id}`)
        .send(withoutTitle);

      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"title" is required');
    });

    it('should return 400 when author is missing', async () => {
      const { author: _author, ...withoutAuthor } = validPayload;

      const res = await request(app)
        .put(`/api/books/${bookFixture.id}`)
        .send(withoutAuthor);

      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"author" is required');
    });

    it('should return 400 when genre is missing', async () => {
      const { genre: _genre, ...withoutGenre } = validPayload;

      const res = await request(app)
        .put(`/api/books/${bookFixture.id}`)
        .send(withoutGenre);

      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"genre" is required');
    });

    it('should return 400 when year is missing', async () => {
      const { year: _year, ...withoutYear } = validPayload;

      const res = await request(app)
        .put(`/api/books/${bookFixture.id}`)
        .send(withoutYear);

      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"year" is required');
    });

    it('should return 400 when year is out of range', async () => {
      const res = await request(app)
        .put(`/api/books/${bookFixture.id}`)
        .send({ ...validPayload, year: 999 });

      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatch(/year.*between 1000/);
    });

    it('should return 400 when title exceeds 200 characters', async () => {
      const res = await request(app)
        .put(`/api/books/${bookFixture.id}`)
        .send({ ...validPayload, title: 'A'.repeat(201) });

      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatch(/"title" must be at most 200 characters/);
    });
  });
});
