import { Book, BookWithReviews } from '@bookshelf/shared';
import {
  bookStore,
  reviewStore,
  shelfStore,
  generateId,
} from '../data/fileStore';
import { ApiError } from '../middleware/errorHandler';

export interface PaginatedBooks {
  data: Book[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateReviewInput {
  rating: number;
  text: string;
}

export interface CreateBookInput {
  title: string;
  author: string;
  genre: string;
  year: number;
  isbn?: string;
  description?: string;
}

export class BookService {
  getAllBooks(
    filters?: { genre?: string; author?: string; year?: number },
    pagination?: { page: number; limit: number },
  ): PaginatedBooks {
    let books = bookStore.readAll();

    if (filters?.genre) {
      books = books.filter(
        (book) => book.genre.toLowerCase() === filters.genre!.toLowerCase(),
      );
    }

    if (filters?.author) {
      books = books.filter((book) =>
        book.author.toLowerCase().includes(filters.author!.toLowerCase()),
      );
    }

    if (filters?.year) {
      books = books.filter((book) => book.year === filters.year);
    }

    const total = books.length;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? total;
    const totalPages = Math.max(1, Math.ceil(total / (limit || 1)));

    return {
      data: books.slice((page - 1) * limit, page * limit),
      total,
      page,
      totalPages,
    };
  }

  getBookById(id: string): BookWithReviews | null {
    const books = bookStore.readAll();
    const book = books.find((b) => b.id === id);

    if (!book) {
      return null;
    }

    const reviews = reviewStore.readAll().filter((r) => r.bookId === id);

    return {
      ...book,
      reviews,
    };
  }

  searchBooks(
    query: string,
    pagination?: { page: number; limit: number },
  ): PaginatedBooks {
    const books = bookStore.readAll();
    const lowerQuery = query.toLowerCase();

    const filtered = books.filter(
      (book) =>
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery) ||
        book.genre.toLowerCase().includes(lowerQuery),
    );

    const total = filtered.length;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? total;
    const totalPages = Math.max(1, Math.ceil(total / (limit || 1)));

    return {
      data: filtered.slice((page - 1) * limit, page * limit),
      total,
      page,
      totalPages,
    };
  }

  updateBook(id: string, data: CreateBookInput): Book | null {
    const books = bookStore.readAll();
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const updated: Book = {
      ...books[index],
      title: data.title,
      author: data.author,
      genre: data.genre,
      year: data.year,
      isbn: data.isbn ?? '',
      description: data.description ?? '',
    };
    books[index] = updated;

    try {
      bookStore.writeAll(books);
    } catch {
      throw new ApiError(500, 'Failed to update book');
    }

    return updated;
  }

  deleteBook(id: string): Book | null {
    const books = bookStore.readAll();
    const index = books.findIndex((b) => b.id === id);

    if (index === -1) {
      return null;
    }

    const [deleted] = books.splice(index, 1);

    const shelves = shelfStore.readAll();
    for (const shelf of shelves) {
      shelf.bookIds = shelf.bookIds.filter((bookId) => bookId !== id);
    }

    try {
      bookStore.writeAll(books);
    } catch {
      throw new ApiError(500, 'Failed to delete book');
    }

    const shelves = shelfStore.readAll();
    const updatedShelves = shelves.map((shelf) => ({
      ...shelf,
      bookIds: shelf.bookIds.filter((bid) => bid !== id),
    }));
    if (updatedShelves.some((s, i) => s.bookIds.length !== shelves[i].bookIds.length)) {
      try {
        shelfStore.writeAll(updatedShelves);
      } catch {
        throw new ApiError(500, 'Failed to update shelves after deleting book');
      }
    }

    return deleted;
  }

  getBookReviews(bookId: string): Review[] | null {
    const books = bookStore.readAll();
    if (!books.some((b) => b.id === bookId)) return null;
    return reviewStore.readAll().filter((r) => r.bookId === bookId);
  }

  createReview(bookId: string, data: CreateReviewInput): Review | null {
    const books = bookStore.readAll();
    const bookExists = books.some((b) => b.id === bookId);

    if (!bookExists) {
      return null;
    }

    const reviews = reviewStore.readAll();
    const newReview: Review = {
      id: generateId('review'),
      bookId,
      userId: '',
      rating: data.rating,
      text: data.text,
      createdAt: new Date().toISOString(),
    };

    reviews.push(newReview);

    try {
      reviewStore.writeAll(reviews);
    } catch {
      throw new ApiError(500, 'Failed to save review');
    }

    return newReview;
  }

  createBook(data: CreateBookInput): Book {
    const books = bookStore.readAll();
    const newBook: Book = {
      id: generateId('book'),
      title: data.title,
      author: data.author,
      genre: data.genre,
      year: data.year,
      isbn: data.isbn ?? '',
      description: data.description ?? '',
      coverUrl: null,
      addedAt: new Date().toISOString(),
    };

    books.push(newBook);

    try {
      bookStore.writeAll(books);
    } catch {
      throw new ApiError(500, 'Failed to save book');
    }

    return newBook;
  }
}

export const bookService = new BookService();
