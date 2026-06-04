import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import listRoutes from '../src/routes/lists';
import { errorHandler, ApiError } from '../src/middleware/errorHandler';
import { readingListService } from '../src/services/readingListService';

jest.mock('../src/services/readingListService');

const app = express();
app.use(express.json());
app.use('/api', listRoutes);
app.use(errorHandler);

const mockedService = readingListService as jest.Mocked<typeof readingListService>;

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const listId = 'list_abc123';

const listFixture = {
  id: listId,
  name: 'To Read',
  description: 'My reading list',
  bookIds: ['book_mpv2br89vfs5bj'],
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
};

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

const listWithBooks = { ...listFixture, books: [bookFixture] };

// ---------------------------------------------------------------------------
// POST /api/lists
// ---------------------------------------------------------------------------

describe('POST /api/lists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a list and return it with status 201', async () => {
    // Arrange
    mockedService.createList.mockReturnValue(listFixture);

    // Act
    const res = await request(app)
      .post('/api/lists')
      .send({ name: 'To Read', description: 'My reading list' });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toEqual(listFixture);
    expect(mockedService.createList).toHaveBeenCalledWith({
      name: 'To Read',
      description: 'My reading list',
    });
  });

  it('should create a list without description and return 201', async () => {
    // Arrange
    const listWithoutDesc = { ...listFixture, description: '' };
    mockedService.createList.mockReturnValue(listWithoutDesc);

    // Act
    const res = await request(app)
      .post('/api/lists')
      .send({ name: 'To Read' });

    // Assert
    expect(res.status).toBe(201);
    expect(mockedService.createList).toHaveBeenCalledWith({ name: 'To Read' });
  });

  it('should return 400 when name is missing', async () => {
    // Act
    const res = await request(app)
      .post('/api/lists')
      .send({ description: 'No name here' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('should return 400 when name is an empty string', async () => {
    // Act
    const res = await request(app)
      .post('/api/lists')
      .send({ name: '' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('should return 400 when name is whitespace only', async () => {
    // Act
    const res = await request(app)
      .post('/api/lists')
      .send({ name: '   ' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('should return 400 when description is not a string', async () => {
    // Act
    const res = await request(app)
      .post('/api/lists')
      .send({ name: 'To Read', description: 123 });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('should return 500 when the service throws ApiError(500)', async () => {
    // Arrange
    mockedService.createList.mockImplementation(() => {
      throw new ApiError(500, 'Failed to create reading list');
    });

    // Act
    const res = await request(app)
      .post('/api/lists')
      .send({ name: 'To Read', description: 'My reading list' });

    // Assert
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Failed to create reading list');
  });
});

// ---------------------------------------------------------------------------
// GET /api/lists
// ---------------------------------------------------------------------------

describe('GET /api/lists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all lists wrapped in a data array with status 200', async () => {
    // Arrange
    mockedService.getAllLists.mockReturnValue([listFixture]);

    // Act
    const res = await request(app).get('/api/lists');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [listFixture] });
  });

  it('should return an empty data array when no lists exist', async () => {
    // Arrange
    mockedService.getAllLists.mockReturnValue([]);

    // Act
    const res = await request(app).get('/api/lists');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });
});

// ---------------------------------------------------------------------------
// GET /api/lists/:id
// ---------------------------------------------------------------------------

describe('GET /api/lists/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the list with books with status 200', async () => {
    // Arrange
    mockedService.getListById.mockReturnValue(listWithBooks);

    // Act
    const res = await request(app).get(`/api/lists/${listId}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: listId,
      books: expect.arrayContaining([
        expect.objectContaining({ id: bookFixture.id, title: bookFixture.title }),
      ]),
    });
    expect(mockedService.getListById).toHaveBeenCalledWith(listId);
  });

  it('should return 404 when the list is not found', async () => {
    // Arrange
    mockedService.getListById.mockReturnValue(null);

    // Act
    const res = await request(app).get('/api/lists/list_doesnotexist');

    // Assert
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('List not found');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/lists/:id/books
// ---------------------------------------------------------------------------

describe('PUT /api/lists/:id/books', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a book and return the updated list with status 200', async () => {
    // Arrange
    mockedService.addOrRemoveBook.mockReturnValue(listFixture);

    // Act
    const res = await request(app)
      .put(`/api/lists/${listId}/books`)
      .send({ bookId: 'book_mpv2br89vfs5bj', action: 'add' });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual(listFixture);
    expect(mockedService.addOrRemoveBook).toHaveBeenCalledWith(
      listId,
      'book_mpv2br89vfs5bj',
      'add',
    );
  });

  it('should remove a book and return the updated list with status 200', async () => {
    // Arrange
    const updatedList = { ...listFixture, bookIds: [] };
    mockedService.addOrRemoveBook.mockReturnValue(updatedList);

    // Act
    const res = await request(app)
      .put(`/api/lists/${listId}/books`)
      .send({ bookId: 'book_mpv2br89vfs5bj', action: 'remove' });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedList);
    expect(mockedService.addOrRemoveBook).toHaveBeenCalledWith(
      listId,
      'book_mpv2br89vfs5bj',
      'remove',
    );
  });

  it('should return 404 when the list is not found (service returns null)', async () => {
    // Arrange
    mockedService.addOrRemoveBook.mockReturnValue(null);

    // Act
    const res = await request(app)
      .put(`/api/lists/list_doesnotexist/books`)
      .send({ bookId: 'book_mpv2br89vfs5bj', action: 'add' });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('List not found');
  });

  it('should return 404 when the book is not found (service throws ApiError 404)', async () => {
    // Arrange
    mockedService.addOrRemoveBook.mockImplementation(() => {
      throw new ApiError(404, 'Book not found');
    });

    // Act
    const res = await request(app)
      .put(`/api/lists/${listId}/books`)
      .send({ bookId: 'book_doesnotexist', action: 'add' });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Book not found');
  });

  it('should return 400 when bookId is missing', async () => {
    // Act
    const res = await request(app)
      .put(`/api/lists/${listId}/books`)
      .send({ action: 'add' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('should return 400 when bookId is an empty string', async () => {
    // Act
    const res = await request(app)
      .put(`/api/lists/${listId}/books`)
      .send({ bookId: '', action: 'add' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('should return 400 when action is missing', async () => {
    // Act
    const res = await request(app)
      .put(`/api/lists/${listId}/books`)
      .send({ bookId: 'book_mpv2br89vfs5bj' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('should return 400 when action is an invalid value', async () => {
    // Act
    const res = await request(app)
      .put(`/api/lists/${listId}/books`)
      .send({ bookId: 'book_mpv2br89vfs5bj', action: 'read' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('should return 500 when the service throws ApiError(500)', async () => {
    // Arrange
    mockedService.addOrRemoveBook.mockImplementation(() => {
      throw new ApiError(500, 'Failed to update reading list');
    });

    // Act
    const res = await request(app)
      .put(`/api/lists/${listId}/books`)
      .send({ bookId: 'book_mpv2br89vfs5bj', action: 'add' });

    // Assert
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Failed to update reading list');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/lists/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/lists/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the deleted list with status 200', async () => {
    // Arrange
    mockedService.deleteList.mockReturnValue(listFixture);

    // Act
    const res = await request(app).delete(`/api/lists/${listId}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual(listFixture);
    expect(mockedService.deleteList).toHaveBeenCalledWith(listId);
  });

  it('should return 404 when the list is not found', async () => {
    // Arrange
    mockedService.deleteList.mockReturnValue(null);

    // Act
    const res = await request(app).delete('/api/lists/list_doesnotexist');

    // Assert
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('List not found');
  });

  it('should return 500 when the service throws ApiError(500)', async () => {
    // Arrange
    mockedService.deleteList.mockImplementation(() => {
      throw new ApiError(500, 'Failed to delete reading list');
    });

    // Act
    const res = await request(app).delete(`/api/lists/${listId}`);

    // Assert
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Failed to delete reading list');
  });
});
