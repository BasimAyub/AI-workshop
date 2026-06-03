import express from 'express';
import request from 'supertest';
import bookRoutes from '../src/routes/books';
import { errorHandler } from '../src/middleware/errorHandler';
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

    const paginatedResult = (data = bookFixtures, page = 1, total = bookFixtures.length) => ({
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
      mockedBookService.searchBooks.mockReturnValue(paginatedResult(match, 1, 1));

      // Act
      const res = await request(app).get('/api/books/search').query({ q: 'Gatsby' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('The Great Gatsby');
      expect(mockedBookService.searchBooks).toHaveBeenCalledWith('Gatsby', { page: 1, limit: 9 });
    });

    it('should find books matching an author name', async () => {
      // Arrange
      const fitzBooks = bookFixtures.slice(0, 2);
      mockedBookService.searchBooks.mockReturnValue(paginatedResult(fitzBooks, 1, 2));

      // Act
      const res = await request(app).get('/api/books/search').query({ q: 'Fitzgerald' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('should find books matching a genre', async () => {
      // Arrange
      mockedBookService.searchBooks.mockReturnValue(paginatedResult(bookFixtures, 1, 3));

      // Act
      const res = await request(app).get('/api/books/search').query({ q: 'Fiction' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });

    it('should perform case-insensitive search', async () => {
      // Arrange
      const match = [bookFixtures[0]];
      mockedBookService.searchBooks.mockReturnValue(paginatedResult(match, 1, 1));

      // Act
      const res = await request(app).get('/api/books/search').query({ q: 'gatsby' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data[0].title).toBe('The Great Gatsby');
      expect(mockedBookService.searchBooks).toHaveBeenCalledWith('gatsby', { page: 1, limit: 9 });
    });

    it('should find books on a partial match', async () => {
      // Arrange
      const fitzBooks = bookFixtures.slice(0, 2);
      mockedBookService.searchBooks.mockReturnValue(paginatedResult(fitzBooks, 1, 2));

      // Act
      const res = await request(app).get('/api/books/search').query({ q: 'fitz' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('should return empty results when no books match', async () => {
      // Arrange
      mockedBookService.searchBooks.mockReturnValue(paginatedResult([], 1, 0));

      // Act
      const res = await request(app).get('/api/books/search').query({ q: 'xyznotabook' });

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
      const res = await request(app).get('/api/books/search').query({ q: '   ' });

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
      const res = await request(app).get('/api/books/search').query({ q: 'fiction' });

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
      mockedBookService.searchBooks.mockReturnValue(paginatedResult([bookFixtures[2]], 2, 3));

      // Act
      const res = await request(app).get('/api/books/search').query({ q: 'fiction', page: '2', limit: '1' });

      // Assert
      expect(res.status).toBe(200);
      expect(mockedBookService.searchBooks).toHaveBeenCalledWith('fiction', { page: 2, limit: 1 });
    });

    it('should return 400 when page is not an integer', async () => {
      // Act
      const res = await request(app).get('/api/books/search').query({ q: 'gatsby', page: 'two' });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/page.*valid integer/i);
    });

    it('should return 400 when limit is not an integer', async () => {
      // Act
      const res = await request(app).get('/api/books/search').query({ q: 'gatsby', limit: 'ten' });

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
      const res = await request(app).post('/api/books').send({ ...validBook, year: 999 });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatch(/year.*between 1000/);
    });

    it('should return 400 when year exceeds the current year', async () => {
      // Act
      const res = await request(app).post('/api/books').send({ ...validBook, year: 9999 });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatch(/year.*between 1000/);
    });

    it('should return 400 when year is not a number', async () => {
      // Act
      const res = await request(app).post('/api/books').send({ ...validBook, year: 'nineteen twenty-five' });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"year" must be a number');
    });

    it('should return 400 when title exceeds 200 characters', async () => {
      // Arrange
      const longTitle = 'A'.repeat(201);

      // Act
      const res = await request(app).post('/api/books').send({ ...validBook, title: longTitle });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatch(/"title" must be at most 200 characters/);
    });

    it('should return 400 when title is an empty string', async () => {
      // Act
      const res = await request(app).post('/api/books').send({ ...validBook, title: '   ' });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.error.details).toContain('"title" must not be empty');
    });

    it('should accept optional isbn and description', async () => {
      // Arrange
      const bookWithOptionals = { ...validBook, isbn: '978-3-16-148410-0', description: 'A classic novel.' };
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
});
