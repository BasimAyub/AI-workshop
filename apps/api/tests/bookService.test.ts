import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { bookService } from '../src/services/bookService';
import { bookStore, reviewStore } from '../src/data/fileStore';

jest.mock('../src/data/fileStore');

const mockedBookStore = bookStore as jest.Mocked<typeof bookStore>;
const mockedReviewStore = reviewStore as jest.Mocked<typeof reviewStore>;

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

describe('bookService.getRatingSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compute averageRating to one decimal place and return totalReviews', () => {
    mockedBookStore.readAll.mockReturnValue([bookFixture]);
    mockedReviewStore.readAll.mockReturnValue([
      { id: 'r1', bookId: bookFixture.id, userId: '', rating: 4, text: '', createdAt: '' },
      { id: 'r2', bookId: bookFixture.id, userId: '', rating: 4, text: '', createdAt: '' },
      { id: 'r3', bookId: bookFixture.id, userId: '', rating: 5, text: '', createdAt: '' },
    ]);

    const result = bookService.getRatingSummary(bookFixture.id);

    // (4 + 4 + 5) / 3 = 4.333... → rounded to 1 decimal → 4.3
    expect(result).toEqual({ bookId: bookFixture.id, averageRating: 4.3, totalReviews: 3 });
  });

  it('should return null when the book does not exist', () => {
    mockedBookStore.readAll.mockReturnValue([]);

    const result = bookService.getRatingSummary('book_doesnotexist');

    expect(result).toBeNull();
    expect(mockedReviewStore.readAll).not.toHaveBeenCalled();
  });
});
